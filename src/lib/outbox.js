import { sheetPost } from "./api.js";

// Persistent outbox: entries are stored locally first, then flushed to the sheet in the
// background. Survives offline, app close and flaky signal. The server dedupes by Id/Date,
// so a retry can never create a duplicate row.
const KEY = "wayfarer_outbox_v1";
const listeners = new Set();
let flushing = false;
let timer = null;
let failures = 0;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};
const write = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked: keep going in memory only */
  }
  listeners.forEach((fn) => fn(items));
};

export const getOutbox = read;
export const subscribeOutbox = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function enqueue(item) {
  write([...read(), item]);
  flush();
}

export async function flush() {
  if (flushing) return;
  clearTimeout(timer);
  flushing = true;
  try {
    let items = read();
    while (items.length) {
      const [head] = items;
      await sheetPost(head.payload);
      failures = 0;
      items = read().filter((i) => i.key !== head.key);
      write(items);
    }
  } catch (err) {
    failures += 1;
    // backoff: 4s, 8s, 16s ... capped at 60s
    timer = setTimeout(flush, Math.min(60000, 2000 * 2 ** Math.min(failures, 5)));
    listeners.forEach((fn) => fn(read(), err));
  } finally {
    flushing = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flush();
  });
  setTimeout(flush, 500);
}
