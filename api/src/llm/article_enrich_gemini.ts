import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

function getModel(modelName: string) {
    const rawKey = config.llm.geminiApiKey || "";
    const apiKey = rawKey.trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: modelName });
}

function extractFirstJsonObject(text: string): any {
    const start = text.indexOf("{");
    if (start < 0) throw new Error("No JSON object start found");
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (ch === "{") depth++;
        if (ch === "}") depth--;
        if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
    throw new Error("Unclosed JSON object");
}

// Memory cache for the working model
let cachedWorkingModel: string | null = "gemini-1.5-flash";

async function callGemini(userContent: string) {
    if (!config.llm.geminiApiKey) {
        throw new Error("GEMINI_API_KEY is missing");
    }

    const modelsToTry = cachedWorkingModel
        ? [cachedWorkingModel, "gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"]
        : ["gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            const model = getModel(modelName);
            const result = await model.generateContent(userContent);
            const response = await result.response;
            const text = response.text().trim();

            if (modelName !== cachedWorkingModel) {
                cachedWorkingModel = modelName;
            }
            return text;
        } catch (err: any) {
            lastError = err;
            const isNotFoundError = err.message.includes("404") || err.message.includes("not found");
            const isHighDemandError = err.message.includes("503") || err.message.includes("Service Unavailable") || err.message.includes("high demand");
            const isQuotaExceeded = err.message.includes("429") || err.message.includes("Too Many Requests") || err.message.includes("quota");

            if (isNotFoundError || isHighDemandError || isQuotaExceeded) {
                continue;
            } else {
                throw err;
            }
        }
    }
    throw lastError;
}

export async function enrichArticleWithLLM(input: {
    title: string;
    url: string;
    contentText: string;
}, opts?: { signal?: AbortSignal }): Promise<{
    aiSummary: string;
    extractedBehaviors: string[];
    observedTools: string[];
}> {
    const clipped = input.contentText.slice(0, 10000);

    const prompt = `
Return ONLY valid JSON. No markdown. No extra text.

Schema:
{
  "aiSummary": "string",
  "extractedBehaviors": ["string", "..."],
  "observedTools": ["string", "..."]
}

Task:
- Summarize the article for SOC action (2-4 sentences) in English.
- Extract attacker behaviors (TTP-like), max 8 items.
- Extract tools/frameworks/keywords, max 8 items.

Article:
- Title: ${input.title}
- URL: ${input.url}
- Content:
${clipped}
`.trim();

    const content = await callGemini(prompt);

    try {
        const obj = extractFirstJsonObject(content);
        return {
            aiSummary: String(obj?.aiSummary ?? ""),
            extractedBehaviors: Array.isArray(obj?.extractedBehaviors) ? obj.extractedBehaviors.map(String) : [],
            observedTools: Array.isArray(obj?.observedTools) ? obj.observedTools.map(String) : [],
        };
    } catch (e) {
        console.error("Gemini JSON parse failed, returning empty enrichment", e);
        return {
            aiSummary: "",
            extractedBehaviors: [],
            observedTools: [],
        };
    }
}
