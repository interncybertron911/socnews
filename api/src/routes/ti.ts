import { Router } from "express";
import { ThreatArticleModel } from "../models/ThreatArticle";

import { fetchArticleText } from "../ti/article_fetch";
import { fetchHNContext } from "../ti/hn_fetch";
import { enrichArticleWithLLM } from "../llm/article_enrich_gemini";
import { ingestHN } from "../ti/hn_ingest_service";
import { makeRequestAbortController } from "../utils/requestAbort";

const router = Router();

// กว้างก่อน แล้ว filter ด้วย keyword ใน title (เหมือนที่คุณทำแล้ว)
const HN_QUERY = "a";
const SECURITY_KEYWORDS = [
    "security",
    "cyber",
    "cve",
    "vulnerability",
    "exploit",
    "malware",
    "ransomware",
    "phishing",
    "breach",
    "backdoor",
    "zero day",
    "zeroday",
    "infosec",
    "botnet",
    "ddos",
    "supply chain",
    "oauth",
    "token",
    "credential",
    "windows",
    "linux",
    "ssh",
    "attack",
    "patch",
    "bug",
    "0day",
    "cisa",
    "xss",
    "rce",
    "sqli",
    "deserialization",
    "auth bypass",
    "privilege escalation",
    "lpe",
    "eop",
];

type HNAlgoliaHit = {
    objectID: string;
    title?: string;
    url?: string;
    created_at_i?: number; // unix seconds
    author?: string;
    points?: number;
    num_comments?: number;
};

async function fetchHN(hitsPerPage: number, page: number) {
    const apiUrl =
        "https://hn.algolia.com/api/v1/search_by_date" +
        `?query=${encodeURIComponent(HN_QUERY)}` +
        `&tags=story` +
        `&page=${page}` +
        `&hitsPerPage=${hitsPerPage}`;

    const r = await fetch(apiUrl);
    if (!r.ok) throw new Error(`hn_fetch_failed:${r.status}`);
    return (await r.json()) as { hits: HNAlgoliaHit[] };
}

function isSecurityTitle(title: string): boolean {
    const t = title.toLowerCase();
    return SECURITY_KEYWORDS.some((kw) => t.includes(kw));
}

/**
 * POST /ti/ingest/hn
 * - ดึง HN ล่าสุด แล้วกรอง security
 * - upsert ลง Mongo (externalId เป็น unique)
 * - ของใหม่: status=NEW
 * - ของเดิม: ไม่แก้ status/readAt (รักษาสถานะที่ทีมทำไว้)
 */
router.post("/ingest/hn", async (req, res) => {
    try {
        const hitsPerPage = Number(req.query.hitsPerPage ?? 100);
        const maxPages = Number(req.query.maxPages ?? req.query.pages ?? 10);

        const result = await ingestHN({ hitsPerPage, maxPages });
        return res.json({ ok: true, ...result });
    } catch (e: any) {
        console.error("[INGEST][HN] route error", e?.message ?? e);
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});


router.get("/articles", async (req, res) => {
    console.log("[/ti/articles] Fetching news list...", {
        status: req.query.status,
        title: req.query.title,
        limit: req.query.limit
    });
    try {
        const limit = Math.min(Number(req.query.limit ?? 50), 200);

        const statusCsv = String(req.query.status ?? "NEW,READ,IN_PROGRESS").trim();
        const title = String(req.query.title ?? "").trim();
        const assignedTo = String(req.query.assignedTo ?? "").trim();
        const startDate = String(req.query.startDate ?? "").trim();
        const endDate = String(req.query.endDate ?? "").trim();

        const statuses = statusCsv
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const includeDeleted = String(req.query.includeDeleted ?? "false") === "true";

        const q: any = {};
        if (statuses.length > 0) q.status = { $in: statuses };
        if (!includeDeleted) q.isDeleted = false;

        // Title Search (case-insensitive)
        if (title) {
            q.title = { $regex: title, $options: "i" };
        }

        // AssignedTo Search (case-insensitive)
        if (assignedTo) {
            q.assignedTo = { $regex: assignedTo, $options: "i" };
        }

        // Date Range (publishTime in ISO)
        if (startDate || endDate) {
            q.publishTime = {};
            if (startDate) q.publishTime.$gte = startDate;
            if (endDate) q.publishTime.$lte = endDate;
        }

        const items = await ThreatArticleModel.find(q)
            .sort({ publishTime: -1 }) // ใหม่ก่อนตามเวลา publish ของ HN
            .limit(limit)
            .lean();

        return res.json({ ok: true, items });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

router.post("/articles/:externalId/read", async (req, res) => {
    try {
        const externalId = String(req.params.externalId ?? "").trim();
        if (!externalId) return res.status(400).json({ ok: false, error: "missing_externalId" });

        const readBy = String(req.body?.readBy ?? "").trim() || null;

        const doc = await ThreatArticleModel.findOne({ externalId, isDeleted: false });
        if (!doc) return res.status(404).json({ ok: false, error: "not_found" });

        // เปลี่ยนเฉพาะตอนยังเป็น NEW
        if (doc.status === "NEW") {
            doc.status = "READ";
            doc.readAt = new Date();
            doc.readBy = readBy;
            await doc.save();
        }

        return res.json({ ok: true, item: doc });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

router.post("/articles/:externalId/unlock", async (req, res) => {
    try {
        const externalId = String(req.params.externalId ?? "").trim();
        if (!externalId) return res.status(400).json({ ok: false, error: "missing_externalId" });

        const username = String(req.body?.username ?? "").trim();

        const doc = await ThreatArticleModel.findOne({ externalId });
        if (!doc) return res.status(404).json({ ok: false, error: "not_found" });

        if (doc.lockedBy === username || !username) {
            doc.lockedBy = null;
            doc.lockedAt = null;
            await doc.save();
        }

        return res.json({ ok: true });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

router.patch("/articles/:externalId", async (req, res) => {
    try {
        const externalId = String(req.params.externalId ?? "").trim();
        if (!externalId) return res.status(400).json({ ok: false, error: "missing_externalId" });

        const status = String(req.body?.status ?? "").trim();
        const assignedTo = req.body?.assignedTo;

        const allowed = ["NEW", "READ", "IN_PROGRESS", "COMPLETE"];
        if (status && !allowed.includes(status)) {
            return res.status(400).json({ ok: false, error: "invalid_status" });
        }

        const doc = await ThreatArticleModel.findOne({ externalId });
        if (!doc) return res.status(404).json({ ok: false, error: "not_found" });

        if (status) {
            doc.status = status as any;
            // If status is changed back from COMPLETE/Deleted to something active (NEW, READ, etc.)
            if (status !== "COMPLETE") {
                doc.isDeleted = false;
                doc.deletedAt = null;
            }
        }
        if (assignedTo !== undefined) doc.assignedTo = assignedTo;

        await doc.save();

        return res.json({ ok: true, item: doc });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

router.delete("/articles/:externalId", async (req, res) => {
    try {
        const externalId = String(req.params.externalId ?? "").trim();
        if (!externalId) return res.status(400).json({ ok: false, error: "missing_externalId" });

        const doc = await ThreatArticleModel.findOne({ externalId, isDeleted: false });
        if (!doc) return res.status(404).json({ ok: false, error: "not_found" });

        doc.isDeleted = true;
        doc.deletedAt = new Date();
        await doc.save();

        return res.json({ ok: true });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message ?? "internal_error" });
    }
});

export default router;
