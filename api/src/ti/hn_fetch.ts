// api/src/ti/hn_fetch.ts
import * as cheerio from "cheerio";

const HN_API = "https://hacker-news.firebaseio.com/v0";

type HNItem = {
    id: number;
    type?: string;
    by?: string;
    time?: number;
    title?: string;
    text?: string;  // HTML
    url?: string;
    score?: number;
    kids?: number[];
    deleted?: boolean;
    dead?: boolean;
};

function stripHtml(html: string): string {
    const $ = cheerio.load(html || "");
    const txt = $.text();
    return txt.replace(/\s+/g, " ").trim();
}

async function fetchHNItem(id: number, opts?: { signal?: AbortSignal }): Promise<HNItem | null> {
    const res = await fetch(`${HN_API}/item/${id}.json`, { signal: opts?.signal });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as HNItem | null;
    if (!data) return null;
    if (data.deleted || data.dead) return null;
    return data;
}

export function parseHNExternalId(externalId: string): number | null {
    // externalId: hn_<number>
    const m = /^hn_(\d+)$/.exec(externalId.trim());
    if (!m) return null;
    const id = Number(m[1]);
    return Number.isFinite(id) ? id : null;
}

export async function fetchHNContext(externalId: string, opts?: { maxComments?: number; signal?: AbortSignal }) {
    const hnId = parseHNExternalId(externalId);
    if (!hnId) throw new Error("invalid_hn_externalId");

    const maxComments = opts?.maxComments ?? 10;

    const item = await fetchHNItem(hnId, opts);
    if (!item) throw new Error("hn_item_not_found");

    const title = item.title || "";
    const url = item.url || "";
    const postText = item.text ? stripHtml(item.text) : "";

    const kids = Array.isArray(item.kids) ? item.kids : [];
    const topKids = kids.slice(0, maxComments);

    const comments: string[] = [];
    for (const cid of topKids) {
        const c = await fetchHNItem(cid, opts);
        if (!c) continue;
        const cText = c.text ? stripHtml(c.text) : "";
        if (cText) comments.push(cText);
    }

    // รวมเป็น context text ที่ LLM ใช้
    const contextParts: string[] = [];
    contextParts.push(`HN Title: ${title}`);
    if (url) contextParts.push(`HN URL: ${url}`);
    if (postText) contextParts.push(`HN Post: ${postText}`);
    if (comments.length) {
        contextParts.push(`Top comments:\n- ${comments.join("\n- ")}`);
    }

    return {
        hnId,
        title,
        url,
        postText,
        comments,
        contextText: contextParts.join("\n\n"),
        sourceUsed: "HN_FALLBACK" as const,
    };
}
