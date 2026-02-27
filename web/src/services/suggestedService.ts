import { apiGet } from "./apiClient";
import type { SigmaRule, SuggestedUseCase, ThreatArticle } from "../models/incidentModel";

export type SuggestedResponse = {
    articleId: string;
    article?: ThreatArticle;
    sigmaRules: SigmaRule[];
    analysis?: {
        newsSummary: string;
        sigmaReasoning: string;
        splunkReasoning: string;
        splunkQuery: string;
        primaryRuleId: string | null;
    };
    status: "READY" | "RUNNING" | "ERROR";
    cachedRuleIds?: string[];
};

export async function fetchSuggested(articleId: string, opts?: { signal?: AbortSignal, ruleId?: string, task?: "summary" | "reasoning" | "explanation" }): Promise<SuggestedResponse> {
    return await apiGet<SuggestedResponse>("/lookup", { articleId, ...opts });
}
