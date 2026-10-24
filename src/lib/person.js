// Tidy a traveller name: trim, collapse spaces, capitalise words, and reuse the spelling
// of an existing person when it only differs by case ("sagar" -> "Sagar").
export function normPerson(input, known = []) {
  const t = String(input ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const hit = known.find((k) => k.toLowerCase() === t.toLowerCase());
  if (hit) return hit;
  return t.replace(/(^|\s)(\p{L})/gu, (_, sp, ch) => sp + ch.toUpperCase());
}

const PALETTE = ["#38bdf8", "#ffc46b", "#34d399", "#a78bfa", "#fb7185", "#fb923c", "#2dd4bf", "#f472b6"];
export function personColor(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export const initial = (name) => (String(name).trim()[0] || "?").toUpperCase();
