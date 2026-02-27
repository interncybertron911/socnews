import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cron from "node-cron";
import { config } from "./config";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocket } from "./socket";

import suggestedRoutes from "./routes/suggested";
import tiRoutes from "./routes/ti";
import sigmaRoutes from "./routes/sigma";
import authRoutes from "./routes/auth";

import { ingestHN } from "./ti/hn_ingest_service";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
    },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.use("/lookup", suggestedRoutes);
app.use("/ti", tiRoutes);
app.use("/sigma", sigmaRoutes);
app.use("/auth", authRoutes);

// Central error handler
app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message ?? "Internal error" });
});

async function main() {
    // ✅ Validate required env early (production-friendly)
    if (!config.mongoUri) {
        throw new Error("Missing MONGO_URI in environment variables");
    }
    if (!config.jwtSecret) {
        throw new Error("Missing JWT_SECRET in environment variables");
    }
    if (config.llm.enabled && !config.llm.geminiApiKey) {
        throw new Error("LLM is enabled but missing GEMINI_API_KEY in environment variables");
    }

    await mongoose.connect(config.mongoUri);
    console.log("Mongo connected");

    // Initialize Socket logic
    setupSocket(io);

    // ✅ START CRON AFTER DB READY
    cron.schedule("*/30 * * * *", async () => {
        console.log("[CRON][HN] tick");
        try {
            await ingestHN({ hitsPerPage: 100, maxPages: 10 });
        } catch (e: any) {
            console.error("[CRON][HN] error", e?.message ?? e);
        }
    });

    console.log("[CRON][HN] scheduled every 30 minutes");

    // ✅ Render provides process.env.PORT
    httpServer.listen(config.port, () => {
        console.log(`API listening on port ${config.port}`);
        console.log("Socket.io ready on same port");
    });
}

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    console.log(`Memory usage: ${used.toFixed(2)} MB`);
}, 60000);

main().catch((e) => {
    console.error("Startup failed:", e);
    process.exit(1);
});