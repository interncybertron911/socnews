// api/src/ti/hn_ingest_service.ts
import { ThreatArticleModel } from "../models/ThreatArticle";
import { IngestStateModel } from "../models/IngestState";

const HN_QUERY = "a";
const SECURITY_KEYWORDS = [
    "security", "cyber", "cve", "vulnerability", "exploit", "malware", "ransomware",
    "phishing", "breach", "backdoor", "zero day", "zeroday", "infosec", "botnet", "ddos",
    "supply chain", "oauth", "token", "credential", "windows", "linux", "ssh",
];

type HNAlgoliaHit = {
    objectID: string;
    title?: string;
    url?: string;
    created_at_i?: number; // unix seconds
};

async function fetchHN(hitsPerPage: number, page: number) {
    const apiUrl =
        "https://hn.algolia.com/api/v1/search_by_date" +
        `?query=${encodeURIComponent(HN_QUERY)}` +
        `&tags=story&page=${page}&hitsPerPage=${hitsPerPage}`;

    const r = await fetch(apiUrl);
    if (!r.ok) throw new Error(`hn_fetch_failed:${r.status}`);
    return (await r.json()) as { hits: HNAlgoliaHit[] };
}

function isSecurityTitle(title: string): boolean {
    const t = title.toLowerCase();
    return SECURITY_KEYWORDS.some((kw) => t.includes(kw));
}

// 🔒 simple in-memory lock (OK for single instance)
let running = false;

export async function ingestHN(options?: {
    hitsPerPage?: number;
    maxPages?: number;   // เพดานสูงสุด
    stateKey?: string;   // override ได้
}) {
    if (running) {
        console.log("[INGEST][HN] skipped (already running)");
        return { skipped: true };
    }
    running = true;

    const t0 = Date.now();
    const hitsPerPage = Math.min(options?.hitsPerPage ?? 100, 200);
    const maxPages = Math.min(options?.maxPages ?? 10, 50);
    const stateKey = options?.stateKey ?? "hn_security";

    console.log("[INGEST][HN] start(incremental)", { hitsPerPage, maxPages, stateKey });

    try {
        // 1) load state
        const state = await IngestStateModel.findOneAndUpdate(
            { key: stateKey },
            { $setOnInsert: { key: stateKey, lastSeenCreatedAt: 0 } },
            { upsert: true, new: true }
        ).lean();

        const lastSeen = Number(state?.lastSeenCreatedAt ?? 0);

        console.log("[INGEST][HN] state loaded", { lastSeenCreatedAt: lastSeen });

        let fetchedTotal = 0;
        let matchedTotal = 0;
        let inserted = 0;
        let skippedExisting = 0;

        let newestSeenThisRun = lastSeen; // จะอัปเดตจาก hits ที่ใหม่กว่า
        let stopEarly = false;
        let pagesFetched = 0;

        // 2) fetch pages until old content reached
        for (let p = 0; p < maxPages; p++) {
            const data = await fetchHN(hitsPerPage, p);
            const hits = data.hits ?? [];
            pagesFetched++;
            fetchedTotal += hits.length;

            if (hits.length === 0) {
                stopEarly = true;
                break;
            }

            // เช็ค newestSeenThisRun จากทุก hits (ไม่ใช่เฉพาะ security)
            for (const h of hits) {
                const ts = Number(h.created_at_i ?? 0);
                if (ts > newestSeenThisRun) newestSeenThisRun = ts;
            }

            // ✅ stop early: ถ้าในหน้านี้มีข่าวที่เก่ากว่า/เท่ากับ lastSeen แล้ว
            // เพราะ search_by_date เรียงใหม่ -> เก่า, พอเจอ <= lastSeen แปลว่าเลยจุดข่าวใหม่แล้ว
            const hasOld = hits.some((h) => Number(h.created_at_i ?? 0) <= lastSeen);
            if (hasOld) {
                stopEarly = true;
            }

            const candidates = hits.filter((h) => h.title && isSecurityTitle(h.title));
            matchedTotal += candidates.length;

            for (const h of candidates) {
                // ถ้า item นี้เก่ากว่า/เท่ากับ lastSeen แล้ว ไม่ต้องพยายาม insert
                const createdAt = Number(h.created_at_i ?? 0);
                if (createdAt && createdAt <= lastSeen) continue;

                const externalId = `hn_${h.objectID}`;
                const title = h.title!;
                const url = h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`;
                const publishTime = createdAt ? new Date(createdAt * 1000) : new Date();

                const result = await ThreatArticleModel.updateOne(
                    { externalId },
                    {
                        $setOnInsert: {
                            externalId,
                            source: "Hacker News",
                            title,
                            url,
                            publishTime,
                            status: "NEW",
                            readAt: null,
                            readBy: null,
                            isDeleted: false,
                            deletedAt: null,
                        },
                    },
                    { upsert: true }
                );

                if (result.upsertedCount && result.upsertedCount > 0) inserted++;
                else skippedExisting++;
            }

            // หน่วงนิดเดียวกันโหลดหนัก
            await new Promise((r) => setTimeout(r, 150));

            if (stopEarly) break;
        }

        // 3) update state (only if saw something newer)
        const nextLastSeen = Math.max(lastSeen, newestSeenThisRun);

        const ms = Date.now() - t0;

        await IngestStateModel.updateOne(
            { key: stateKey },
            {
                $set: {
                    lastSeenCreatedAt: nextLastSeen,
                    lastRunAt: new Date(),
                    lastResult: {
                        fetchedTotal,
                        matchedTotal,
                        inserted,
                        skippedExisting,
                        pagesFetched,
                        stopEarly,
                        ms,
                    },
                },
            }
        );

        console.log("[INGEST][HN] done(incremental)", {
            lastSeenBefore: lastSeen,
            lastSeenAfter: nextLastSeen,
            fetchedTotal,
            matchedTotal,
            inserted,
            skippedExisting,
            pagesFetched,
            stopEarly,
            ms,
        });

        return {
            fetchedTotal,
            matchedTotal,
            inserted,
            skippedExisting,
            pagesFetched,
            stopEarly,
            ms,
            lastSeenBefore: lastSeen,
            lastSeenAfter: nextLastSeen,
        };
    } finally {
        running = false;
    }
}
