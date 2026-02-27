import "dotenv/config";

/**
 * Centralized Backend Configuration
 * - Local: read from .env
 * - Render/Server: read from Environment Variables
 */

export const config = {
    // Render จะ set PORT ให้เอง
    port: Number(process.env.PORT ?? 3000),

    // ✅ ใช้ชื่อเดียวกับที่คุณใช้ในโค้ด: MONGO_URI
    mongoUri: process.env.MONGO_URI || "",

    llm: {
        enabled: process.env.LLM_ENABLED === "true",
        // ✅ ห้ามมีค่า default ใน production
        geminiApiKey: process.env.GEMINI_API_KEY || "",
        suggestPromptVersion: process.env.SUGGEST_PROMPT_VERSION || "v1",
    },

    pythonBin: process.env.PYTHON_BIN || "python",

    // ✅ ห้ามมีค่า default ใน production
    jwtSecret: process.env.JWT_SECRET || "",
};

// ⚠️ Warn only (จะไป throw จริงใน server.ts)
if (!config.mongoUri) {
    console.warn("⚠️  Warning: MONGO_URI is not defined");
}

if (!config.jwtSecret) {
    console.warn("⚠️  Warning: JWT_SECRET is not defined");
}

if (config.llm.enabled && !config.llm.geminiApiKey) {
    console.warn("⚠️  Warning: LLM is enabled but GEMINI_API_KEY is missing");
}