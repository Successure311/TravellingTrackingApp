// Apps Script Web App "/exec" URL. Can be overridden with VITE_WEBAPP_URL in Cloudflare Pages.
export const WEBAPP_URL =
  import.meta.env.VITE_WEBAPP_URL ||
  "https://script.google.com/macros/s/AKfycbw7sHgZcX8Oc7P5HVVblPVfsfu0uQE-85FUxS-JRXLxe8k0YFzBVb0lAuUP4KyT_2xt/exec";

export const HAS_BACKEND = WEBAPP_URL.startsWith("https://");
