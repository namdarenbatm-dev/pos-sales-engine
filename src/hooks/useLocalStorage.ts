import { useEffect, useState } from "react";

/**
 * Single persistence primitive for the whole app. Swap this file's internals
 * for a backend call later (e.g. fetch/save to an API) without touching any
 * page or component — everything reads/writes through this hook only, so
 * financial data is never duplicated or stored inconsistently in two places.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can fail (quota, private mode) — the app must keep working
      // in-memory even if persistence silently fails.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
