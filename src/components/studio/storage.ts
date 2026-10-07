"use client";

import { useEffect, useSyncExternalStore } from "react";
import { storeLocal } from "./data";
import { bootstrapLibrary, cacheKey, syncFailure } from "./persistence";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("sparkle-storage", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("sparkle-storage", listener);
  };
}

export function useLocalValue<T>(key: string, fallback: T) {
  useEffect(() => { if (key === "sparkle:assets" || key === "sparkle:templates") void bootstrapLibrary(key.slice(8) as "assets" | "templates").catch(syncFailure); }, [key]);
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(cacheKey(key));
      } catch {
        return null;
      }
    },
    () => null,
  );
  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    /* Invalid browser data leaves the empty state usable. */
  }
  return [value, (next: T) => storeLocal(key, next)] as const;
}
