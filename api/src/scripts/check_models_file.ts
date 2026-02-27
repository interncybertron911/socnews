import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import * as fs from "fs";

const apiKey = (process.env.GEMINI_API_KEY || "").trim();

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data: any = await response.json();

        if (data.error) {
            fs.writeFileSync("gemini_error.txt", data.error.message);
            return;
        }

        const models = data.models.map((m: any) => m.name);
        fs.writeFileSync("models_found.txt", models.join("\n"));

    } catch (e: any) {
        fs.writeFileSync("gemini_error.txt", e.message);
    }
}

checkModels();
