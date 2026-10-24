import { canonicalCity } from "../data/indianCities.js";

const KEY = "wayfarer_recent_places";

// Always the official spelling, no duplicates ("Bangalore" and "Bengaluru" are one place).
const clean = (names) => [...new Set(names.map(canonicalCity).filter(Boolean))];

export function getRecent() {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY) || "[]")).slice(0, 8);
  } catch {
    return [];
  }
}

export function pushRecent(...names) {
  try {
    localStorage.setItem(KEY, JSON.stringify(clean([...names, ...getRecent()]).slice(0, 8)));
  } catch {
    /* ignore */
  }
}
