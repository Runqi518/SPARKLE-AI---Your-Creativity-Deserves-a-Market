import { createHash } from "node:crypto";
import type { GenerationKind, ProviderSummary } from "../../../schemas/studio-generation";
import { StudioError } from "./http";

export const kinds: GenerationKind[] = ["text", "image", "video"];
export function redact(value: string) {
  for (const kind of kinds) {
    const key = process.env[`SPARKLE_${kind.toUpperCase()}_API_KEY`]?.trim();
    if (key) for (const secret of [key, encodeURIComponent(key)]) value = value.split(secret).join("[redacted]");
  }
  return value;
}

export function httpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
    return url;
  } catch { throw new StudioError("Expected an HTTP(S) URL without embedded credentials."); }
}

export function dot(value: unknown, path: string): unknown {
  if (!path || path === "$") return value;
  return path.split(".").reduce<unknown>((current, key) => {
    if (["__proto__", "constructor", "prototype"].includes(key)) return undefined;
    return current !== null && typeof current === "object" && Object.hasOwn(current, key)
      ? (current as Record<string, unknown>)[key] : undefined;
  }, value);
}

const variables = new Set(["model", "prompt", "rolePrompt", "messages", "count", "size", "aspectRatio", "resolution", "duration", "images", "videos", "image", "video", "jobId"]);
export function render(template: unknown, values: Record<string, unknown>): unknown {
  if (typeof template === "string") {
    const exact = template.match(/^\{\{(\w+)\}\}$/);
    if (exact) {
      if (!variables.has(exact[1])) throw new StudioError("Unknown provider template variable.", 503);
      return values[exact[1]] ?? null;
    }
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      if (!variables.has(key)) throw new StudioError("Unknown provider template variable.", 503);
      const value = values[key];
      return typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    });
  }
  if (Array.isArray(template)) return template.map(item => render(item, values));
  if (template && typeof template === "object") return Object.fromEntries(Object.entries(template).map(([key, value]) => [key, render(value, values)]));
  return template;
}

export function providerConfig(kind: GenerationKind) {
  const get = (name: string, fallback = "") => process.env[`SPARKLE_${kind.toUpperCase()}_${name}`]?.trim() || fallback;
  const number = (name: string, fallback: number, min: number, max: number) => {
    const value = Number(get(name, String(fallback)));
    if (!Number.isInteger(value) || value < min || value > max) throw new StudioError("Invalid provider numeric configuration.", 503);
    return value;
  };
  const template = (name: string) => {
    const value = get(name);
    if (!value) return undefined;
    try {
      if (value.length > 32000) throw new Error();
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      render(parsed, {});
      return parsed;
    } catch { throw new StudioError("Invalid provider JSON request template.", 503); }
  };
  const model = get("MODEL");
  const models = [...new Set([model, ...get("MODELS").split(",")].map(s => s.trim()).filter(Boolean))];
  if (models.length > 32 || models.some(s => s.length > 160 || !/^[\w./:@+-]+$/.test(s) || redact(s) !== s)) {
    throw new StudioError("Invalid provider model allowlist.", 503);
  }
  const base = get("BASE_URL");
  const key = get("API_KEY");
  const endpoint = get("ENDPOINT", kind === "text" ? "/chat/completions" : kind === "image" ? "/images/generations" : "/videos");
  const pollEndpoint = get("POLL_ENDPOINT", "/videos/{{jobId}}");
  const resolve = (endpoint: string) => {
    // Leading slash is relative to the configured API base, retaining /v1.
    const url = /^https?:\/\//.test(endpoint) ? endpoint : `${base.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    try { return httpUrl(url).toString(); }
    catch { throw new StudioError("Invalid provider endpoint configuration.", 503); }
  };
  const authHeader = get("AUTH_HEADER", "Authorization");
  const authScheme = get("AUTH_SCHEME", "Bearer");
  if (!/^[A-Za-z0-9-]+$/.test(authHeader) || /[\r\n]/.test(key + authScheme)) throw new StudioError("Invalid provider authentication configuration.", 503);
  const config = {
    kind, model, models, key, configured: Boolean(base && key && model),
    endpoint: base ? resolve(endpoint) : "", pollEndpoint: base ? resolve(pollEndpoint) : "",
    authHeader, authScheme: authScheme === "none" ? "" : authScheme,
    requestTemplate: template("REQUEST_TEMPLATE"), pollTemplate: template("POLL_REQUEST_TEMPLATE"),
    pollMethod: get("POLL_METHOD", "GET"),
    outputPath: get("OUTPUT_PATH", kind === "text" ? "choices" : kind === "image" ? "data" : "url"),
    urlPath: get("URL_PATH", "url"), b64Path: get("B64_PATH", "b64_json"),
    jobIdPath: get("JOB_ID_PATH", "id"), statusPath: get("STATUS_PATH", "status"),
    pollOutputPath: get("POLL_OUTPUT_PATH", get("OUTPUT_PATH", "url")),
    success: get("SUCCESS_STATUSES", "succeeded,completed,success").toLowerCase().split(",").map(s => s.trim()),
    failure: get("FAILURE_STATUSES", "failed,error,cancelled,canceled").toLowerCase().split(",").map(s => s.trim()),
    timeoutMs: number("TIMEOUT_MS", 60000, 100, 120000),
    jobTimeoutMs: number("JOB_TIMEOUT_MS", 900000, 1000, 86400000),
    pollIntervalMs: number("POLL_INTERVAL_MS", 3000, 100, 60000),
    maxResponseBytes: number("MAX_RESPONSE_BYTES", 20000000, 1024, 64000000),
  };
  if (!["GET", "POST"].includes(config.pollMethod)) throw new StudioError("Invalid provider poll method.", 503);
  return config;
}
export type ProviderConfig = ReturnType<typeof providerConfig>;
export function requireProvider(kind: GenerationKind, selectedModel?: string) {
  const config = providerConfig(kind);
  if (!config.configured) throw new StudioError(`Configure SPARKLE_${kind.toUpperCase()}_BASE_URL, API_KEY and MODEL before generating.`, 503);
  if (selectedModel && !config.models.includes(selectedModel)) throw new StudioError("Select a configured model.");
  return { ...config, model: selectedModel || config.model };
}
export function configFingerprint(config: ProviderConfig) {
  return createHash("sha256").update(JSON.stringify(config)).digest("hex");
}
export function providerSummaries(): ProviderSummary[] {
  return kinds.map(kind => {
    try {
      const config = providerConfig(kind);
      return { kind, configured: config.configured, models: config.models, defaultModel: config.model };
    } catch { return { kind, configured: false, models: [], defaultModel: "" }; }
  });
}
