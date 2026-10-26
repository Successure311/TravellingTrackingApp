import { MONTHS } from "./time.js";

const yearOf = (s) => Number(String(s).slice(0, 4));
const monthOf = (s) => Number(String(s).slice(5, 7)) - 1;

export function yearsOf(travel, stay) {
  const ys = new Set([...travel.map((t) => yearOf(t.dDate)), ...stay.map((s) => yearOf(s.date))]);
  ys.delete(NaN);
  return [...ys].sort((a, b) => b - a);
}

const empty = (label) => ({ label, trips: 0, mins: 0, home: 0, away: 0, stayMins: 0 });

const at = (d, t) => new Date(`${d}T${t || "00:00"}:00`);

// How long each logged stay counts for, in minutes (key: "person|date").
// Default: a full day (24 h). But when a stay is followed by a trip leaving from that same city,
// the stay is the real time from ARRIVING until that next departure:
//   arrive Mumbai 26 Oct 21:00, next train leaves Mumbai 27 Oct 06:00  ->  9 h of stay, not 24 h.
export function stayMinutes(travel, stay) {
  const mins = new Map(stay.map((s) => [`${s.person}|${s.date}`, 1440]));
  const byPerson = new Map();
  travel
    .filter((t) => t.mins > 0 && t.dDate && t.dTime && t.aDate && t.aTime)
    .forEach((t) => byPerson.set(t.person, [...(byPerson.get(t.person) || []), t]));
  for (const [person, list] of byPerson) {
    list.sort((a, b) => at(a.dDate, a.dTime) - at(b.dDate, b.dTime));
    for (let i = 0; i < list.length - 1; i++) {
      const t = list[i];
      const next = list[i + 1];
      if (next.source !== t.destination) continue;
      const gap = Math.round((at(next.dDate, next.dTime) - at(t.aDate, t.aTime)) / 60000);
      if (!(gap > 0)) continue;
      // the nights logged in that city from the arrival date up to the day before the next departure
      const nights = stay
        .filter((s) => s.person === person && s.city === t.destination && s.date >= t.aDate && s.date < next.dDate)
        .sort((a, b) => a.date.localeCompare(b.date));
      nights.forEach((s, k) => mins.set(`${s.person}|${s.date}`, k === 0 ? gap : 0));
    }
  }
  return mins;
}

// Everything the Insights tables need for one year (or "all"). A logged stay counts as 1 day.
export function summarize({ travel, stay, year, month = "all" }) {
  const byDay = year !== "all" && month !== "all";
  const inScope = (d) => (year === "all" || yearOf(d) === year) && (!byDay || monthOf(d) === month);
  const entryMins = stayMinutes(travel, stay);
  const trips = travel.filter((t) => inScope(t.dDate) && t.mins > 0);
  const stays = stay.filter((s) => inScope(s.date));

  // one row per month (or per year when "all"), only periods that have data
  const rows = new Map();
  const slot = (key, label) => {
    if (!rows.has(key)) rows.set(key, empty(label));
    return rows.get(key);
  };
  const dayOf = (d) => Number(String(d).slice(8, 10));
  const keyOf = (d) =>
    year === "all" ? [yearOf(d), String(yearOf(d))] : byDay ? [dayOf(d), `${dayOf(d)} ${MONTHS[month]}`] : [monthOf(d), MONTHS[monthOf(d)]];
  trips.forEach((t) => {
    const r = slot(...keyOf(t.dDate));
    r.trips += 1;
    r.mins += t.mins;
  });
  stays.forEach((s) => {
    const r = slot(...keyOf(s.date));
    if (s.type === "Home") r.home += 1;
    else r.away += 1;
    r.stayMins += entryMins.get(`${s.person}|${s.date}`) ?? 1440;
  });
  const list = [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);

  const totals = list.reduce((a, r) => ({ trips: a.trips + r.trips, mins: a.mins + r.mins, home: a.home + r.home, away: a.away + r.away, stayMins: a.stayMins + r.stayMins }), { trips: 0, mins: 0, home: 0, away: 0, stayMins: 0 });

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

  // every unique city that appears (origin, destination or stay), A to Z
  const cityMap = new Map(places.map((p) => [p.name, { name: p.name, arrivals: p.arrivals, nights: p.nights }]));
  const city = (n) => {
    if (!cityMap.has(n)) cityMap.set(n, { name: n, arrivals: 0, nights: 0 });
  };
  trips.forEach((t) => city(t.source));
  stays.forEach((s) => city(s.city));
  const cities = [...cityMap.values()].filter((c) => c.name).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

  // per traveller (used when looking at everyone)
  const pp = new Map();
  const person = (n) => {
    if (!pp.has(n)) pp.set(n, { name: n, trips: 0, mins: 0, stayMins: 0 });
    return pp.get(n);
  };
  trips.forEach((t) => {
    const p = person(t.person);
    p.trips += 1;
    p.mins += t.mins;
  });
  stays.forEach((s) => (person(s.person).stayMins += entryMins.get(`${s.person}|${s.date}`) ?? 1440));
  const people = [...pp.values()].sort((a, b) => b.mins + b.stayMins - (a.mins + a.stayMins));

  return { rows: list, totals, modes, places, cities, people };
}
