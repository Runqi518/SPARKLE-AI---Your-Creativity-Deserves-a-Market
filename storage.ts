"use client";

import { useSyncExternalStore } from "react";
import { storeLocal } from "./data";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("sparkle-storage", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("sparkle-storage", listener);
  };
}

export function useLocalValue<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
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
