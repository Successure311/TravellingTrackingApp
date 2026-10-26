import { WEBAPP_URL, HAS_BACKEND } from "../config.js";

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Unexpected response from Google Sheet script");
  }
}

// text/plain keeps this a CORS "simple request": no preflight, so Apps Script answers fast.
export async function sheetPost(payload) {
  if (!HAS_BACKEND) throw new Error("Apps Script URL not set in src/config.js");
  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const out = await readJson(res);
  if (out && out.error) {
    const e = new Error(out.error);
    e.server = true; // the script answered with an error (not a network problem)
    throw e;
  }
  return out;
}

// Both tabs in one round trip.
export async function fetchAll(fresh = false) {
  if (!HAS_BACKEND) throw new Error("Apps Script URL not set in src/config.js");
  const res = await fetch(`${WEBAPP_URL}?all=1${fresh ? "&fresh=1" : ""}`);
  const out = await readJson(res);
  if (out && out.error) throw new Error(out.error);
  return out; // { travel: [...], stay: [...] }
}
