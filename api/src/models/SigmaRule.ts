// api/src/models/SigmaRule.ts
import { Schema, model } from "mongoose";

const SigmaRuleSchema = new Schema(
    {
        ruleId: { type: String, required: true, unique: true }, // sigma YAML: id
        title: { type: String, required: true },

        level: { type: String, default: null },
        status: { type: String, default: null },
        tags: { type: [String], default: [] },

        // ✅ เพิ่ม fields ที่ UI อยากโชว์
        description: { type: String, default: "" },           // sigma YAML: description
        falsepositives: { type: [String], default: [] },      // sigma YAML: falsepositives
        references: { type: [String], default: [] },          // sigma YAML: references

        // raw sigma structures
        logsource: { type: Schema.Types.Mixed, default: {} }, // sigma YAML: logsource
        detection: { type: Schema.Types.Mixed, default: {} }, // sigma YAML: detection

        // source metadata
        sourcePath: { type: String, required: true }, // rules/...
        slug: { type: String, required: true },
        yamlLink: { type: String, required: true },

        // for text search
        text: { type: String, default: "" },

        isCustom: { type: Boolean, default: false },
        sourceYaml: { type: String, default: "" }, // ✅ Store raw YAML content to avoid filesystem dependency
    },
    { timestamps: true }
);

// text index
SigmaRuleSchema.index({ title: "text", text: "text", tags: "text" });

export const SigmaRuleModel = model("SigmaRule", SigmaRuleSchema);
