const KEY = "wayfarer_recent_places";

export function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushRecent(...names) {
  try {
    const cur = getRecent();
    const next = [...names.filter(Boolean), ...cur].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
