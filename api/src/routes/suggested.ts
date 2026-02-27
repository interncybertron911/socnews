import { Router } from "express";
import crypto from "crypto";
import path from "path";
import fsp from "fs/promises";

import { ThreatArticleModel } from "../models/ThreatArticle";
import { SigmaRuleModel } from "../models/SigmaRule";
import { SuggestedCacheModel } from "../models/SuggestedCache";
import { convertSigmaToSplunk } from "./sigma";
import {
    generateNewsSummaryGemini,
    generateSigmaReasoningGemini,
    generateSplunkExplanationGemini
} from "../llm/suggested_analysis_gemini";
import { makeRequestAbortController } from "../utils/requestAbort";

const router = Router();
import { config } from "../config";

/**
 * In-flight lock (DEV-friendly)
 * กันกดซ้ำ/ยิงซ้ำระหว่าง LLM กำลังทำงาน
 */
const inFlight = new Set<string>();

function sha1(s: string) {
    return crypto.createHash("sha1").update(s).digest("hex");
}

function buildQueryFromTitle(title: string): string {
    const stop = new Set([
        "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "from", "at", "by", "is", "are",
        "new", "how", "why", "what", "this", "that", "these", "those",
    ]);

    const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !stop.has(w));

    const uniq: string[] = [];
    for (const w of words) if (!uniq.includes(w)) uniq.push(w);
    return uniq.slice(0, 6).join(" ");
}

function buildMatchReasons(articleTitle: string, ruleTitle: string, tags: string[] = []) {
    const a = articleTitle.toLowerCase();
    const r = ruleTitle.toLowerCase();
    const reasons: string[] = [];

    const tokens = a.split(/\s+/).filter((t) => t.length >= 5);
    const overlaps = tokens.filter((t) => r.includes(t)).slice(0, 3);
    if (overlaps.length) reasons.push(`Title overlap: ${overlaps.join(", ")}`);

    const tagHints = tags.filter((t) => t.includes("attack."));
    if (tagHints.length) reasons.push(`MITRE tags present: ${tagHints.slice(0, 2).join(", ")}`);

    if (!reasons.length) reasons.push("Relevant by full-text search on Sigma rule corpus.");
    return reasons;
}

router.get("/", async (req, res) => {
    const tReq = Date.now();
    const controller = makeRequestAbortController(req, res);
    const signal = controller.signal;

    const articleId = String(req.query.articleId ?? "").trim();
    const ruleId = String(req.query.ruleId ?? "").trim();

    console.log("[/suggested] 6-panel request start", { articleId, ruleId });

    signal.addEventListener("abort", () => {
        console.log(`[/suggested] 🚨 ABORTED by client: articleId=${articleId}, ruleId=${ruleId}`);
    });

    try {
        if (!articleId) {
            return res.status(400).json({ error: "missing_articleId" });
        }

        const task = String(req.query.task || "").trim(); // "summary", "reasoning", "explanation", or empty

        // 1) Load article
        const article = await ThreatArticleModel.findOne({ externalId: articleId, isDeleted: false }).lean();
        if (!article) {
            return res.status(404).json({ error: "article_not_found" });
        }

        // 2) Build query & Sigma search
        const q = buildQueryFromTitle(article.title);
        const sigma = await SigmaRuleModel.find(
            { $text: { $search: q } },
            {
                score: { $meta: "textScore" },
                ruleId: 1,
                title: 1,
                level: 1,
                status: 1,
                tags: 1,
                logsource: 1,
                description: 1,
                sourcePath: 1,
            }
        )
            .sort({ score: { $meta: "textScore" }, ruleId: 1 })
            .limit(10)
            .lean();

        const sigmaRules = sigma.map((r) => {
            let yamlPath = "";
            if (r.sourcePath) {
                const normalized = r.sourcePath.replace(/\\/g, "/");
                const idx = normalized.indexOf("rules/");
                if (idx >= 0) yamlPath = normalized.substring(idx + "rules/".length);
            }
            return {
                id: r.ruleId,
                title: r.title,
                level: r.level ?? null,
                tags: r.tags ?? [],
                yamlPath,
                matchReasons: buildMatchReasons(article.title, r.title, r.tags ?? []),
                description: r.description ?? "",
                sourcePath: r.sourcePath
            };
        });

        // 3) Resolve Target Rule
        let targetRule = sigmaRules[0];
        if (ruleId) {
            const found = sigmaRules.find(r => r.id === ruleId);
            if (found) targetRule = found;
        }
        const resolvedRuleId = targetRule?.id || "none";

        // 4) Cache Logic
        const promptVersion = config.llm.suggestPromptVersion;
        const cacheKey = sha1(`${articleId}:${resolvedRuleId}:${promptVersion}`);
        const sigmaHash = sha1(JSON.stringify(sigmaRules.map(r => r.id).sort()));

        let cached = await SuggestedCacheModel.findOne({ cacheKey }).lean();

        // --- Technical Generation (Non-LLM) ---
        let topSplunkQuery = cached?.result?.splunkQuery || "";
        if (!topSplunkQuery && targetRule) {
            try {
                const ruleFile = path.resolve(process.cwd(), "data", "sigma", targetRule.sourcePath);
                const yamlText = await fsp.readFile(ruleFile, "utf8");
                topSplunkQuery = await convertSigmaToSplunk(yamlText, signal);
            } catch (e) {
                console.error("Splunk conversion failed:", e);
            }
        }

        // --- Handle Direct AI Generation Task ---
        if (task && config.llm.enabled) {
            console.log(`[/lookup] Selective AI Generation: task=${task}, articleId=${articleId}`);
            let fieldToUpdate = "";
            let generatedValue = "";

            if (task === "summary") {
                // Reuse any existing summary for this article if it exists in any cache entry
                const anyCache = await SuggestedCacheModel.findOne({ articleId, "result.newsSummary": { $exists: true, $ne: "" } }).lean();
                if (anyCache) generatedValue = anyCache.result.newsSummary;
                else generatedValue = await generateNewsSummaryGemini({ title: article.title, content: article.contentText });
                fieldToUpdate = "result.newsSummary";
            }
            else if (task === "reasoning" && targetRule) {
                generatedValue = await generateSigmaReasoningGemini(targetRule, article);
                fieldToUpdate = "result.sigmaReasoning";
            }
            else if (task === "explanation" && topSplunkQuery && targetRule) {
                generatedValue = await generateSplunkExplanationGemini(topSplunkQuery, targetRule);
                fieldToUpdate = "result.splunkReasoning";
            }

            if (fieldToUpdate && generatedValue) {
                await SuggestedCacheModel.updateOne(
                    { cacheKey },
                    {
                        $set: {
                            [fieldToUpdate]: generatedValue,
                            "result.splunkQuery": topSplunkQuery,
                            "result.primaryRuleId": targetRule?.id,
                            articleId,
                            promptVersion,
                            sigmaHash
                        }
                    },
                    { upsert: true }
                );
                // Refresh cached object
                cached = await SuggestedCacheModel.findOne({ cacheKey }).lean();
            }
        }

        // 5) Final Response (Current data, cached or not)
        const allCachedForArticle = await SuggestedCacheModel.find({ articleId, promptVersion }).select("result.primaryRuleId").lean();
        const cachedRuleIds = allCachedForArticle.map(c => c.result?.primaryRuleId).filter(Boolean);

        return res.json({
            articleId,
            status: "READY",
            sigmaRules,
            cachedRuleIds,
            analysis: {
                newsSummary: cached?.result?.newsSummary || "",
                sigmaReasoning: cached?.result?.sigmaReasoning || "",
                splunkReasoning: cached?.result?.splunkReasoning || "",
                splunkQuery: topSplunkQuery,
                primaryRuleId: targetRule?.id || null
            }
        });

    } catch (e: any) {
        if (signal.aborted) return;
        console.error("[/lookup] Error:", e);
        return res.status(500).json({ error: e?.message || "internal_error" });
    }
});

export default router;
