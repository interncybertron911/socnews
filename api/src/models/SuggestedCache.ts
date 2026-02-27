import { Schema, model } from "mongoose";

const SuggestedCacheSchema = new Schema(
    {
        cacheKey: { type: String, required: true, unique: true },
        articleId: { type: String, required: true },
        promptVersion: { type: String, required: true },
        sigmaHash: { type: String, required: true },
        result: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

SuggestedCacheSchema.index({ articleId: 1, updatedAt: -1 });

export const SuggestedCacheModel = model("SuggestedCache", SuggestedCacheSchema);
