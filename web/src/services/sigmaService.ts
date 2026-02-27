import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export interface SigmaRule {
    id: string; // mongo _id (string form)
    title: string;
    level: string | null;
    status: string | null;
    tags: string[];
    logsource: any;
    sourcePath: string;
    yamlLink: string;
    slug: string;
    description: string;
    detection: any;
    falsePositives: string[];
    references: string[];
    ruleId: string;
    isCustom: boolean;
}

export function createSigmaRule(data: Partial<SigmaRule>) {
    return apiPost<{ ok: boolean; item: SigmaRule }>("/sigma", data);
}

export function updateSigmaRule(id: string, data: Partial<SigmaRule>) {
    return apiPut<{ ok: boolean; item: SigmaRule }>(`/sigma/${id}`, data);
}

export function deleteSigmaRule(id: string) {
    return apiDelete<{ ok: boolean }>(`/sigma/${id}`);
}

export interface SigmaRulesResponse {
    ok: boolean;
    items: SigmaRule[];
    total: number;
    page: number;
    pages: number;
}

export function fetchSigmaRules(params: {
    q?: string;
    category?: string;
    page?: number;
    limit?: number
}, opts?: { signal?: AbortSignal }) {
    return apiGet<SigmaRulesResponse>("/sigma", { ...params, ...opts });
}

export function fetchSigmaCategories(opts?: { signal?: AbortSignal }) {
    return apiGet<{ ok: boolean; categories: string[] }>("/sigma/categories", {}, opts);
}

export function convertSigmaToSplunk(yamlText: string, opts?: { signal?: AbortSignal }) {
    return apiPost<{ ok: boolean; query: string }>(
        "/sigma/convert-splunk",
        { yamlText },
        opts
    );
}
