const pad = (n) => String(n).padStart(2, "0");

export const todayStr = () => toDateStr(new Date());
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// All times are treated as one timezone (IST), so plain local-time maths is enough.
export function minutesBetween(d1, t1, d2, t2) {
  if (!d1 || !t1 || !d2 || !t2) return null;
  const a = new Date(`${d1}T${t1}:00`);
  const b = new Date(`${d2}T${t2}:00`);
  const m = Math.round((b - a) / 60000);
  return Number.isFinite(m) ? m : null;
}

export function fmtDuration(mins) {
  if (mins == null || mins < 0) return "--";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${pad(m)}m` : `${h}h`;
}

export const fmtHours = (mins) => `${(mins / 60).toFixed(mins >= 6000 ? 0 : 1)}h`;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(s) {
  if (!s) return "";
  const d = parseDate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 18);

// Whole days, hours and minutes of a duration in minutes: 25h -> 1 day 1 h, 24h -> 1 day 0 h.
export function splitDuration(totalMins) {
  const t = Math.max(0, Math.round(totalMins));
  return { d: Math.floor(t / 1440), h: Math.floor((t % 1440) / 60), m: t % 60 };
}
