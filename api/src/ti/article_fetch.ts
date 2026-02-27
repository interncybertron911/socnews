// api/src/ti/article_fetch.ts
import * as cheerio from "cheerio";

const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

function normalizeText(input: string): string {
    return input
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function isGoodText(text: string) {
    // แทน length 300 แบบเดิม: ใช้คำ+ประโยค
    const words = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]\s+/).filter((s) => s.trim().length > 0).length;
    return words >= 80 && sentences >= 3;
}

export async function fetchArticleText(url: string, opts?: { signal?: AbortSignal }): Promise<{ text: string; title?: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    if (opts?.signal) {
        opts.signal.addEventListener("abort", () => controller.abort());
    }

    try {
        // upgrade http -> https (ช่วย 404 บางเคส)
        const safeUrl = url.startsWith("http://") ? "https://" + url.slice("http://".length) : url;

        const res = await fetch(safeUrl, {
            method: "GET",
            signal: controller.signal,
            headers: {
                "User-Agent": UA,
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                // บางเว็บช่วยลด 403 เมื่อใส่ referer
                "Referer": "https://news.ycombinator.com/",
            },
        });

        if (!res.ok) {
            throw new Error(`fetch_failed:${res.status}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        $("script, style, noscript, nav, footer, header, form, iframe, svg").remove();

        const title =
            $("meta[property='og:title']").attr("content") ||
            $("title").text() ||
            undefined;

        const mainText =
            $("article").text() ||
            $("main").text() ||
            $("#content").text() ||
            $(".content").text() ||
            $("body").text();

        const text = normalizeText(mainText);

        if (!isGoodText(text)) {
            throw new Error("content_too_short_or_blocked");
        }

        return { text, title };
    } finally {
        clearTimeout(timeout);
    }
}
