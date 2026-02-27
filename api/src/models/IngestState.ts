// api/src/models/IngestState.ts
import { Schema, model } from "mongoose";

const IngestStateSchema = new Schema(
    {
        key: { type: String, required: true, unique: true }, // e.g. "hn_security"
        lastSeenCreatedAt: { type: Number, default: 0 },     // unix seconds
        lastRunAt: { type: Date, default: null },
        lastResult: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export const IngestStateModel = model("IngestState", IngestStateSchema);
