import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

function getModel(modelName: string) {
    const rawKey = config.llm.geminiApiKey || "";
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, ''); // Remove potential quotes

    console.log(`[Gemini] Attempting to use model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: modelName });
}

// Memory cache for the working model to skip scans in future requests
let cachedWorkingModel: string | null = "gemini-1.5-flash"; // Switched to 1.5-flash for higher daily quotas

async function callGemini(system: string, user: string) {
    if (!config.llm.geminiApiKey) {
        return ""; // Return empty instead of crashing
    }

    const prompt = `System: ${system}\n\nUser: ${user}`;

    // 🚀 ULTRA-RESILIENT LIST: 13 possible models from your account
    const modelsToTry = [
        "models/gemini-2.5-flash",
        "models/gemini-2.5-flash-lite",
        "models/gemini-2.0-flash",
        "models/gemini-2.0-flash-lite",
        "models/gemini-flash-latest",
        "models/gemini-flash-lite-latest",
        "models/gemini-2.0-flash-001",
        "models/gemini-2.0-flash-lite-001",
        "models/gemini-3-flash-preview",
        "models/gemini-2.5-pro",
        "models/gemini-pro-latest",
        "models/gemini-3-pro-preview",
        "models/gemini-3.1-pro-preview"
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[Gemini] Attempting ${modelName}...`);

            // All these experimental models (2.5, 2.0, 3.x) perform best on v1beta
            const apiVersion = "v1beta";

            const rawKey = config.llm.geminiApiKey || "";
            const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: apiVersion as any });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            if (text) {
                console.log(`[Gemini] ⭐ SUCCESS with ${modelName}`);
                return text;
            }
        } catch (err: any) {
            lastError = err;
            console.warn(`[Gemini] ⚠️ ${modelName} failed: ${err.message?.slice(0, 80)}...`);
        }
    }

    console.error("[Gemini] CRITICAL: All 13 models failed. Returning empty string.");
    return ""; // Silent fail
}

/**
 * Summarize threat news for SOC analysts using Gemini.
 */
export async function generateNewsSummaryGemini(article: { title: string; content?: string }) {
    const system = "You are a senior SOC analyst summarizing threat intelligence.";
    const user = `Summarize this threat news in 2-3 concise sentences for a SOC team in English.
    Focus on what happened and why it matters. 
    Title: ${article.title}
    Content: ${article.content?.slice(0, 10000) || "No content provided."}`;

    return await callGemini(system, user);
}

/**
 * Explain why a Sigma rule is relevant to a specific article using Gemini.
 */
export async function generateSigmaReasoningGemini(rule: { title: string; description?: string }, article: { title: string }) {
    const system = "You are a detection engineer explaining rule relevance.";
    const user = `Explain in 2 concise sentences in English why the Sigma rule "${rule.title}" is relevant to the threat news "${article.title}".
    Rule Description: ${rule.description || "N/A"}`;

    return await callGemini(system, user);
}

/**
 * Explain a Splunk query generated from a Sigma rule using Gemini.
 */
export async function generateSplunkExplanationGemini(query: string, rule: { title: string }) {
    const system = "You are a SOC analyst explaining search logic.";
    const user = `Explain in 2-3 concise sentences in English what this Splunk query is looking for and how it detects the threat described in "${rule.title}".
    Splunk Query: ${query}`;

    return await callGemini(system, user);
}
