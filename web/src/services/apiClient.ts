import { config } from "../config";
const API_BASE_URL = config.apiBaseUrl;

export async function apiGet<T>(path: string, params: any = {}, opts?: { signal?: AbortSignal }): Promise<T> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'signal') {
            query.append(k, String(v));
        }
    });

    const queryString = query.toString();
    const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: params?.signal || opts?.signal,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GET ${path} failed: ${res.status} ${text}`);
    }

    return (await res.json()) as T;
}

export async function apiPost<T>(
    path: string,
    body: any,
    opts?: { signal?: AbortSignal }
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: opts?.signal,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`POST ${path} failed: ${res.status} ${text} `);
    }

    return (await res.json()) as T;
}

export async function apiPut<T>(path: string, body: any): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`PUT ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
}
