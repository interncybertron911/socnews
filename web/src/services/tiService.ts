import { apiGet } from "./apiClient";
import { config } from "../config";

export type TIStatus = "NEW" | "READ" | "IN_PROGRESS" | "COMPLETE";

export type TIArticle = {
    externalId: string;         // hn_123
    source: string;
    title: string;
    url: string;
    publishTime: string;        // ISO
    status: TIStatus;
    readAt?: string | null;
    readBy?: string | null;
    assignedTo?: string | null;
    lockedBy?: string | null;
    lockedAt?: string | null;
    isDeleted?: boolean;
};

type TIListResponse = { ok: true; items: TIArticle[] };

export async function fetchTIArticles(
    statusCsv = "NEW,READ,IN_PROGRESS",
    limit = 50,
    opts?: {
        signal?: AbortSignal,
        title?: string,
        assignedTo?: string,
        startDate?: string,
        endDate?: string,
        includeDeleted?: boolean
    }
): Promise<TIArticle[]> {
    const params = {
        status: statusCsv,
        limit,
        ...opts
    };

    const data = await apiGet<TIListResponse>("/ti/articles", params);
    return data.items ?? [];
}

export async function markArticleRead(externalId: string): Promise<void> {
    const base = config.apiBaseUrl;
    const url = `${base}/ti/articles/${encodeURIComponent(externalId)}/read`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // readBy ใส่ทีหลังได้
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`POST /ti/articles/:id/read failed: ${res.status} ${text}`);
    }
}

const base = config.apiBaseUrl;

export async function updateArticleStatus(externalId: string, status: TIStatus, assignedTo?: string | null): Promise<void> {
    const res = await fetch(`${base}/ti/articles/${encodeURIComponent(externalId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedTo }),
    });
    if (!res.ok) throw new Error(`PATCH status failed: ${res.status}`);
}

export async function unlockArticle(externalId: string, username: string): Promise<void> {
    const res = await fetch(`${base}/ti/articles/${encodeURIComponent(externalId)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error(`Unlock failed: ${res.status}`);
}

export async function deleteArticle(externalId: string): Promise<void> {
    const res = await fetch(`${base}/ti/articles/${encodeURIComponent(externalId)}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
}


