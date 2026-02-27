// api/src/routes/sigma.ts
import { Router } from "express";
import { glob } from "glob";
import fs from "fs";
import fsp from "fs/promises";
import yaml from "js-yaml";

import { SigmaRuleModel } from "../models/SigmaRule";
import { buildText, buildYamlLink, slugify } from "../sigma/utils";

import { spawn } from "child_process";
import path from "path";

import { makeRequestAbortController } from "../utils/requestAbort";

const router = Router();
import { config } from "../config";

export function convertSigmaToSplunk(yamlText: string, signal?: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
        const scriptPath = path.resolve(process.cwd(), "scripts", "sigma_to_splunk.py");
        const py = config.pythonBin;

        const child = spawn(py, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (d) => (stdout += d.toString()));
        child.stderr.on("data", (d) => (stderr += d.toString()));

        const onAbort = () => {
            try { child.kill("SIGTERM"); } catch { }
        };

        if (signal) {
            if (signal.aborted) onAbort();
            signal.addEventListener("abort", onAbort, { once: true });
        }

        child.on("error", reject);
        child.on("close", (code, sig) => {
            if (signal) signal.removeEventListener("abort", onAbort as any);

            // ✅ ถ้าโดน kill เพราะ abort ให้ถือว่า cancel ไม่ใช่ error
            if (code === null) {
                if (signal?.aborted) return reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
                return reject(new Error(`sigma_to_splunk terminated (signal=${sig ?? "unknown"})`));
            }

            if (code === 0) return resolve(stdout.trim());
            return reject(new Error(stderr || `sigma_to_splunk exited with code ${code}`));
        });

        child.stdin.write(yamlText);
        child.stdin.end();
    });
}

type SigmaYaml = {
    id?: string;
    title?: string;
    level?: string;
    status?: string;
    tags?: string[];
    description?: string;
    falsepositives?: string[] | string;
    references?: string[] | string;
    logsource?: any;
    detection?: any;
};

function toStringArray(v: any): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string") return [v];
    return [];
}

router.get("/yaml", async (req, res) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) {
            return res.status(400).json({ ok: false, error: "path is required" });
        }

        // ป้องกัน path traversal
        const baseDir = path.resolve(process.cwd(), "data", "sigma", "rules");
        const resolvedPath = path.resolve(baseDir, filePath);

        if (!resolvedPath.startsWith(baseDir)) {
            return res.status(403).json({ ok: false, error: "invalid path" });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ ok: false, error: "file not found" });
        }

        const yaml = fs.readFileSync(resolvedPath, "utf-8");
        return res.json({ ok: true, yaml });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "read failed" });
    }
});

router.post("/convert-splunk", async (req, res) => {
    console.log("[convert] hit"); // (1) เข้ามา route ไหม

    const controller = makeRequestAbortController(req, res);

    try {
        const { yamlText } = req.body ?? {};
        console.log("[convert] yaml length:", (yamlText?.length ?? 0)); // (2) body มาไหม

        const t0 = Date.now();
        const query = await convertSigmaToSplunk(yamlText, controller.signal);
        console.log("[convert] python done in ms:", Date.now() - t0); // (3) python จบไหม

        if (controller.signal.aborted) return;
        console.log("[convert] respond"); // (4) จะตอบแล้วนะ
        return res.json({ ok: true, query });
    } catch (e: any) {
        if (controller.signal.aborted) return; // client gone
        if (e?.name === "AbortError") return res.status(499).json({ ok: false, error: "Client Closed Request" });
        return res.status(500).json({ ok: false, error: e?.message ?? "convert failed" });
    }
});


router.post("/import/local", async (req, res) => {
    try {
        const baseDir = String(req.query.baseDir ?? "data/sigma").trim();
        const rulesGlob = `${baseDir}/rules/**/*.yml`;

        const files = await glob(rulesGlob, { nodir: true });

        let upserted = 0;
        let skippedNoId = 0;
        let failed = 0;

        for (const file of files) {
            try {
                const raw = await fsp.readFile(file, "utf8");
                const obj = yaml.load(raw) as SigmaYaml;

                const ruleId = obj?.id;
                const title = obj?.title;

                if (!ruleId || !title) {
                    skippedNoId++;
                    continue;
                }

                const idx = file.replaceAll("\\", "/").indexOf("/rules/");
                const sourcePath =
                    idx >= 0 ? file.replaceAll("\\", "/").slice(idx + 1) : file.replaceAll("\\", "/");

                const tags: string[] = Array.isArray(obj?.tags) ? obj!.tags! : [];
                const logsource = obj?.logsource ?? {};
                const detection = obj?.detection ?? {};
                const slug = slugify(title);
                const yamlLink = buildYamlLink(sourcePath);

                // ✅ new fields
                const description = typeof obj?.description === "string" ? obj.description : "";
                const falsepositives = toStringArray(obj?.falsepositives);
                const references = toStringArray(obj?.references);

                const text = buildText(title, tags, logsource);

                const r = await SigmaRuleModel.updateOne(
                    { ruleId },
                    {
                        $set: {
                            ruleId,
                            title,
                            level: obj?.level ?? null,
                            status: obj?.status ?? null,
                            tags,
                            description,
                            falsepositives,
                            references,
                            logsource,
                            detection,
                            sourcePath,
                            slug,
                            yamlLink,
                            text,
                            isCustom: false,
                        },
                    },
                    { upsert: true }
                );

                if (r.upsertedCount && r.upsertedCount > 0) upserted++;
            } catch {
                failed++;
            }
        }

        return res.json({
            ok: true,
            files: files.length,
            upserted,
            skippedNoId,
            failed,
        });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

/**
 * GET /sigma/categories
 * Returns list of unique subfolders under rules/
 */
router.get("/categories", async (req, res) => {
    try {
        const categories = await SigmaRuleModel.aggregate([
            {
                $project: {
                    category: {
                        $arrayElemAt: [{ $split: ["$sourcePath", "/"] }, 1]
                    }
                }
            },
            { $group: { _id: "$category" } },
            { $sort: { _id: 1 } }
        ]);
        const list = categories.map((c: any) => c._id).filter(Boolean);
        return res.json({ ok: true, categories: list });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "failed to fetch categories" });
    }
});

/**
 * GET /sigma
 * Server-side filtering, search, and pagination
 * Query Params: q, category, page, limit
 */
router.get("/", async (req, res) => {
    try {
        const q = String(req.query.q ?? "").trim();
        const category = String(req.query.category ?? "").toLowerCase().trim(); // windows, linux, etc.
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Number(req.query.limit ?? 20), 100);
        const skip = (page - 1) * limit;

        const findQuery: any = {};

        // 1) Search Title/Text
        if (q) {
            findQuery.$or = [
                { title: { $regex: q, $options: "i" } },
                { text: { $regex: q, $options: "i" } }
            ];
        }

        // 2) Category Filter (Folder hierarchy check)
        if (category && category !== "all") {
            if (category === "custom") {
                findQuery.isCustom = true;
            } else {
                findQuery.sourcePath = { $regex: `^rules/${category}/`, $options: "i" };
                findQuery.isCustom = { $ne: true }; // Only show system rules when a specific folder category is selected
            }
        }

        const [items, total] = await Promise.all([
            SigmaRuleModel.find(findQuery)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SigmaRuleModel.countDocuments(findQuery)
        ]);

        const mapped = items.map((r: any) => ({
            id: r.ruleId,
            title: r.title,
            level: r.level ?? null,
            status: r.status ?? null,
            tags: r.tags ?? [],
            logsource: r.logsource ?? {},
            yamlLink: r.yamlLink,
            sourcePath: r.sourcePath,
            slug: r.slug,
            description: r.description ?? "",
            detection: r.detection ?? {},
            falsePositives: r.falsepositives ?? [],
            references: r.references ?? [],
            ruleId: r.ruleId,
            isCustom: r.isCustom ?? false,
        }));

        return res.json({
            ok: true,
            items: mapped,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

/**
 * GET /sigma/search?q=...&limit=20
 * Legacy - keeping for internal compatibility if needed
 */
router.get("/search", async (req, res) => {
    try {
        const q = String(req.query.q ?? "").trim();
        const limit = Math.min(Number(req.query.limit ?? 20), 50);

        let items: any[] = [];

        if (q) {
            items = await SigmaRuleModel.find(
                { $text: { $search: q } },
                {
                    score: { $meta: "textScore" },
                    ruleId: 1,
                    title: 1,
                    level: 1,
                    status: 1,
                    tags: 1,
                    description: 1,
                    falsepositives: 1,
                    references: 1,
                    logsource: 1,
                    detection: 1,
                    yamlLink: 1,
                    sourcePath: 1,
                    slug: 1,
                }
            )
                .sort({ score: { $meta: "textScore" }, ruleId: 1 })
                .limit(limit)
                .lean();
        } else {
            items = await SigmaRuleModel.find(
                {},
                {
                    ruleId: 1,
                    title: 1,
                    level: 1,
                    status: 1,
                    tags: 1,
                    description: 1,
                    falsepositives: 1,
                    references: 1,
                    logsource: 1,
                    detection: 1,
                    yamlLink: 1,
                    sourcePath: 1,
                    slug: 1,
                }
            )
                .sort({ updatedAt: -1 })
                .limit(limit)
                .lean();
        }

        const mapped = items.map((r) => ({
            id: r.ruleId,
            title: r.title,
            level: r.level ?? null,
            status: r.status ?? null,
            tags: r.tags ?? [],
            logsource: r.logsource ?? {},
            yamlLink: r.yamlLink,
            sourcePath: r.sourcePath,
            slug: r.slug,

            // ✅ details
            description: r.description ?? "",
            detection: r.detection ?? {},
            falsePositives: r.falsepositives ?? [],
            references: r.references ?? [],
            ruleId: r.ruleId,
            isCustom: r.isCustom ?? false,

            // UI reason placeholders
            matchReasons: [],
            detectionSummary: r.description ?? "",
        }));

        return res.json({ ok: true, items: mapped });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

/**
 * POST /sigma
 * Create a custom Sigma rule
 */
router.post("/", async (req, res) => {
    try {
        const { ruleId, title, description, level, status, tags, logsource, detection, falsepositives, references } = req.body;

        if (!ruleId || !title) {
            return res.status(400).json({ ok: false, error: "ruleId and title are required" });
        }

        const slug = slugify(title);
        const text = buildText(title, tags || [], logsource || {});

        const rule = await SigmaRuleModel.create({
            ruleId,
            title,
            description,
            level,
            status,
            tags: tags || [],
            logsource: logsource || {},
            detection: detection || {},
            falsepositives: falsepositives || [],
            references: references || [],
            sourcePath: "custom",
            yamlLink: "local",
            slug,
            text,
            isCustom: true
        });

        return res.json({ ok: true, item: rule });
    } catch (e: any) {
        if (e.code === 11000) return res.status(400).json({ ok: false, error: "duplicate_rule_id" });
        return res.status(500).json({ ok: false, error: e?.message ?? "creation_failed" });
    }
});

/**
 * PUT /sigma/:id
 * Update a custom Sigma rule
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Ensure we only update custom rules
        const rule = await SigmaRuleModel.findOne({ ruleId: id });
        if (!rule) return res.status(404).json({ ok: false, error: "rule_not_found" });
        if (!rule.isCustom) return res.status(403).json({ ok: false, error: "cannot_edit_system_rule" });

        if (updates.title) updates.slug = slugify(updates.title);
        updates.text = buildText(updates.title || rule.title, updates.tags || rule.tags, updates.logsource || rule.logsource);

        const updated = await SigmaRuleModel.findOneAndUpdate(
            { ruleId: id },
            { $set: updates },
            { new: true }
        );

        return res.json({ ok: true, item: updated });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "update_failed" });
    }
});

/**
 * DELETE /sigma/:id
 * Delete a custom Sigma rule
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure the rule exists
        const rule = await SigmaRuleModel.findOne({ ruleId: id });
        if (!rule) return res.status(404).json({ ok: false, error: "rule_not_found" });

        await SigmaRuleModel.deleteOne({ ruleId: id });

        return res.json({ ok: true });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "delete_failed" });
    }
});

export default router;
