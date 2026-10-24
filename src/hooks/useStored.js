import { useCallback, useState } from "react";

// useState that survives a page reload (for half-filled forms). A draft older than 12 hours
// is dropped so stale values never come back.
const TTL = 12 * 60 * 60 * 1000;

export function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(key));
      if (raw && Date.now() - raw.t < TTL) return raw.v;
    } catch {
      /* ignore */
    }
    return typeof initial === "function" ? initial() : initial;
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const v = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify({ v, t: Date.now() }));
        } catch {
          /* ignore */
        }
        return v;
      });
    },
    [key]
  );

  return [value, set];
}
