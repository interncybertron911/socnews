import { apiGet } from "./apiClient";

export async function fetchSigmaYaml(
    yamlPath: string,
    opts?: { signal?: AbortSignal }
): Promise<string> {
    const res = await apiGet<{ ok: boolean; yaml: string; error?: string }>(
        "/sigma/yaml",
        { path: yamlPath, ...opts }
    );

    if (!res.ok) throw new Error(res.error || "fetchSigmaYaml failed");
    return res.yaml;
}
