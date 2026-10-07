import { AsyncLocalStorage } from "node:async_hooks";

export type Actor = { id: string; admin?: boolean };
export const LOCAL_OWNER = "local-workspace";
const runtime = globalThis as typeof globalThis & { sparkleActors?: AsyncLocalStorage<Actor> };
const actors = runtime.sparkleActors ||= new AsyncLocalStorage<Actor>();
export function currentActor(): Actor { return actors.getStore() || { id: LOCAL_OWNER }; }
export function withActor<T>(actor: Actor, work: () => T): T { return actors.run(actor, work); }
export function captureActor<T>(work: () => T) { const actor = currentActor(); return () => withActor(actor, work); }
