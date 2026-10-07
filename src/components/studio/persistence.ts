"use client";
type Item = { id: string; [key: string]: unknown };
let identity = "uninitialized";
let initialized: Promise<void> | undefined;
const loaded = new Map<string, Promise<void>>();
const queues = new Map<string, Promise<void>>();
export const cacheKey = (key: string) => identity === "local-workspace" ? key : `${identity}:${key}`;
export function writeCache(key: string, value: unknown) {
  localStorage.setItem(cacheKey(key), JSON.stringify(value));
  window.dispatchEvent(new Event("sparkle-storage"));
}
async function call(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const result = await response.json();
  if (response.status === 401) window.location.assign(`/login?next=${encodeURIComponent(location.pathname)}`);
  if (!response.ok) throw new Error(result.error || "Workspace synchronization failed.");
  return result;
}
export function initializeWorkspace() {
  initialized ??= call("/api/auth/session").then(result => {
    identity = result.user.id;
    window.dispatchEvent(new Event("sparkle-storage"));
  }).catch(error => { initialized = undefined; throw error; });
  return initialized;
}
export function syncFailure(error: unknown) {
  window.dispatchEvent(new CustomEvent("sparkle-sync-error", { detail: error instanceof Error ? error.message : "Workspace synchronization failed." }));
}
export function bootstrapLibrary(kind: "assets" | "templates") {
  const key = `sparkle:${kind}`;
  const existing = loaded.get(key);
  if (existing) return existing;
  const promise = (async () => {
    await initializeWorkspace();
    const cached: Item[] = JSON.parse(localStorage.getItem(cacheKey(key)) || "[]");
    await flushPending(kind);
    const { items } = await call(`/api/library/${kind}`) as { items: Item[] };
    const merged = [...items];
    if (identity === "local-workspace" && localStorage.getItem(`${key}:database-migrated`) !== "true") {
      for (const item of cached) if (!merged.some(value => value.id === item.id)) {
        await call(`/api/library/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
        merged.push(item);
      }
      localStorage.setItem(`${key}:database-migrated`, "true");
    }
    writeCache(key, merged);
  })().catch(error => { loaded.delete(key); throw error; });
  loaded.set(key, promise); return promise;
}
type Mutation = { version: string; item: Item; deleted: boolean };
function pendingMutations(kind: string): Record<string, Mutation> {
  return JSON.parse(localStorage.getItem(cacheKey(`sparkle:${kind}:pending`)) || "{}");
}
async function flushPending(kind: string) {
  for (const [id, mutation] of Object.entries(pendingMutations(kind))) {
    await call(`/api/library/${kind}`, { method: mutation.deleted ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mutation.deleted ? { id } : mutation.item) });
    const remaining = pendingMutations(kind);
    if (remaining[id]?.version === mutation.version) delete remaining[id];
    localStorage.setItem(cacheKey(`sparkle:${kind}:pending`), JSON.stringify(remaining));
  }
}
export async function persistLibrary(key: string, next: Item[]) {
  await initializeWorkspace();
  const kind = key.slice("sparkle:".length);
  if (kind !== "assets" && kind !== "templates") return Promise.resolve();
  const previous: Item[] = JSON.parse(localStorage.getItem(cacheKey(key)) || "[]");
  const journal = pendingMutations(kind);
  for (const item of next) if (JSON.stringify(previous.find(old => old.id === item.id)) !== JSON.stringify(item)) journal[item.id] = { version: crypto.randomUUID(), item, deleted: false };
  for (const item of previous) if (!next.some(value => value.id === item.id)) journal[item.id] = { version: crypto.randomUUID(), item, deleted: true };
  localStorage.setItem(cacheKey(`sparkle:${kind}:pending`), JSON.stringify(journal));
  writeCache(key, next);
  const pending = (queues.get(key) || Promise.resolve()).catch(() => {}).then(async () => { await initializeWorkspace(); await flushPending(kind); });
  queues.set(key, pending); pending.catch(syncFailure); return pending;
}
