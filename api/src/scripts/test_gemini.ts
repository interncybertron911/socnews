import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = (process.env.GEMINI_API_KEY || "AIzaSyBagwBrvNJVhzdQHLbb5XgUfUJG8XAs090").trim();
const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
    console.log("--- Gemini Connection Test ---");
    console.log(`Using Key (masked): ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

    try {
        // 1. Try to list models
        console.log("\n1. Listing available models...");
        // Note: listModels is not directly on genAI in the same way, we'll try a simple generate call first

        const modelsToTry = [
            { name: "gemini-1.5-flash", version: "v1" },
            { name: "gemini-1.5-flash-latest", version: "v1beta" },
            { name: "gemini-pro", version: "v1" },
            { name: "gemini-1.0-pro", version: "v1" }
        ];

        for (const m of modelsToTry) {
            console.log(`\nTrying model: ${m.name} (${m.version})...`);
            try {
                const model = genAI.getGenerativeModel({ model: m.name }, { apiVersion: m.version as any });
                const result = await model.generateContent("Hello, are you there?");
                const text = result.response.text();
                console.log(`✅ Success with ${m.name}! Response: ${text.substring(0, 30)}...`);
                return; // Stop if one works
            } catch (e: any) {
                console.error(`❌ Failed ${m.name}: ${e.message}`);
            }
        }

    } catch (globalError: any) {
        console.error("\n💥 Global Error:", globalError.message);
    }
}

testConnection();
