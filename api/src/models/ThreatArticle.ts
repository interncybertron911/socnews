import { Schema, model } from "mongoose";

export type ThreatStatus = "NEW" | "READ" | "IN_PROGRESS" | "COMPLETE";

const ThreatArticleSchema = new Schema(
    {
        externalId: { type: String, required: true, unique: true }, // เช่น hn_123
        source: { type: String, required: true }, // "Hacker News"
        title: { type: String, required: true },
        url: { type: String, required: true },
        publishTime: { type: Date, required: true },

        // เวอร์ชันทีมเดียว: สถานะร่วมกันทั้งทีม
        status: { type: String, enum: ["NEW", "READ", "IN_PROGRESS", "COMPLETE"], default: "NEW" },
        readAt: { type: Date, default: null },
        readBy: { type: String, default: null }, // Username who marked as READ

        // Multi-user / Collaboration fields
        assignedTo: { type: String, default: null }, // Username who is taking responsibility
        lockedBy: { type: String, default: null },   // Current viewer (socket-level lock)
        lockedAt: { type: Date, default: null },

        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },

        contentText: { type: String, default: "" },
    },
    { timestamps: true } // createdAt/updatedAt
);

export const ThreatArticleModel = model("ThreatArticle", ThreatArticleSchema);
