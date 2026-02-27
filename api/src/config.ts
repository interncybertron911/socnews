import "dotenv/config";

/**
 * Centralized Backend Configuration
 * Change values in the .env file instead of hardcoding here.
 */

export const config = {
    port: Number(process.env.PORT ?? 3000),
    mongoUri: process.env.MONGO_URI || "",
    llm: {
        enabled: process.env.LLM_ENABLED === "true",
        geminiApiKey: process.env.GEMINI_API_KEY || "AIzaSyBagwBrvNJVhzdQHLbb5XgUfUJG8XAs090",
        suggestPromptVersion: process.env.SUGGEST_PROMPT_VERSION || "v1",
    },
    pythonBin: process.env.PYTHON_BIN || "python",
    jwtSecret: process.env.JWT_SECRET || "cyber-soc-secret-888",
};

if (!config.mongoUri) {
    console.warn("⚠️  Warning: MONGO_URI is not defined in .env");
}

if (config.llm.enabled && !config.llm.geminiApiKey) {
    console.warn("⚠️  Warning: LLM is enabled but GEMINI_API_KEY is missing in .env");
}
