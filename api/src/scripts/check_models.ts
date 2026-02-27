import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

async function checkModels() {
    console.log("Checking Gemini API models...");
    try {
        // We can't easily list models with the SDK without more complex setup, 
        // but we can try the REST API directly via fetch
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data: any = await response.json();

        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        console.log("Available models:");
        data.models.forEach((m: any) => {
            if (m.name.includes("gemini")) {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
            }
        });

        const flash = data.models.find((m: any) => m.name.includes("gemini-1.5-flash"));
        if (flash) {
            console.log("\n✅ Success: gemini-1.5-flash FOUND!");
            console.log("Full name to use:", flash.name);
        } else {
            console.log("\n❌ Error: gemini-1.5-flash NOT FOUND in the list!");
        }

    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

checkModels();
