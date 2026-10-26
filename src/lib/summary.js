import { MONTHS } from "./time.js";

const yearOf = (s) => Number(String(s).slice(0, 4));
const monthOf = (s) => Number(String(s).slice(5, 7)) - 1;

export function yearsOf(travel, stay) {
  const ys = new Set([...travel.map((t) => yearOf(t.dDate)), ...stay.map((s) => yearOf(s.date))]);
  ys.delete(NaN);
  return [...ys].sort((a, b) => b - a);
}

const empty = (label) => ({ label, trips: 0, mins: 0, home: 0, away: 0 });

// Everything the Insights tables need for one year (or "all"). A logged stay counts as 1 day.
export function summarize({ travel, stay, year }) {
  const inScope = (d) => year === "all" || yearOf(d) === year;
  const trips = travel.filter((t) => inScope(t.dDate) && t.mins > 0);
  const stays = stay.filter((s) => inScope(s.date));

  // one row per month (or per year when "all"), only periods that have data
  const rows = new Map();
  const slot = (key, label) => {
    if (!rows.has(key)) rows.set(key, empty(label));
    return rows.get(key);
  };
  const keyOf = (d) => (year === "all" ? [yearOf(d), String(yearOf(d))] : [monthOf(d), MONTHS[monthOf(d)]]);
  trips.forEach((t) => {
    const r = slot(...keyOf(t.dDate));
    r.trips += 1;
    r.mins += t.mins;
  });
  stays.forEach((s) => {
    const r = slot(...keyOf(s.date));
    if (s.type === "Home") r.home += 1;
    else r.away += 1;
  });
  const list = [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);

  const totals = list.reduce((a, r) => ({ trips: a.trips + r.trips, mins: a.mins + r.mins, home: a.home + r.home, away: a.away + r.away }), { trips: 0, mins: 0, home: 0, away: 0 });

  const modes = ["Flight", "Train", "Car"].map((mode) => {
    const ts = trips.filter((t) => t.mode === mode);
    return { mode, trips: ts.length, mins: ts.reduce((a, t) => a + t.mins, 0) };
  });

  // places: arrivals, nights away, hours spent travelling there
  const pl = new Map();
  const place = (n) => {
    if (!pl.has(n)) pl.set(n, { name: n, arrivals: 0, nights: 0, mins: 0 });
    return pl.get(n);
  };
  trips.forEach((t) => {
    const p = place(t.destination);
    p.arrivals += 1;
    p.mins += t.mins;
  });
  stays.filter((s) => s.type !== "Home").forEach((s) => (place(s.city).nights += 1));
  const places = [...pl.values()].sort((a, b) => b.arrivals + b.nights - (a.arrivals + a.nights) || b.mins - a.mins);

  // per traveller (used when looking at everyone)
  const pp = new Map();
  const person = (n) => {
    if (!pp.has(n)) pp.set(n, { name: n, trips: 0, mins: 0, days: 0 });
    return pp.get(n);
  };
  trips.forEach((t) => {
    const p = person(t.person);
    p.trips += 1;
    p.mins += t.mins;
  });
  stays.forEach((s) => (person(s.person).days += 1));
  const people = [...pp.values()].sort((a, b) => b.mins + b.days * 1440 - (a.mins + a.days * 1440));

  return { rows: list, totals, modes, places, people };
}
