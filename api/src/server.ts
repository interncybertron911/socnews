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
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
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

app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message ?? "Internal error" });
});

const PORT = config.port;

async function main() {
    const MONGO_URI = config.mongoUri;
    if (!MONGO_URI) {
        throw new Error("Missing MONGO_URI in environment (.env)");
    }

    await mongoose.connect(MONGO_URI);
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

    httpServer.listen(PORT, () => {
        console.log(`API listening on http://localhost:${PORT}`);
        console.log(`Socket.io ready on same port`);
    });
}

main().catch((e) => {
    console.error("Startup failed:", e);
    process.exit(1);
});
