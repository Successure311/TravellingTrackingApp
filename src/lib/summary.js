import { MONTHS, parseDate, toDateStr } from "./time.js";

const yearOf = (s) => Number(String(s).slice(0, 4));
const monthOf = (s) => Number(String(s).slice(5, 7)) - 1;

export function yearsOf(travel, stay) {
  const ys = new Set([...travel.map((t) => yearOf(t.dDate)), ...stay.map((s) => yearOf(s.date))]);
  ys.delete(NaN);
  return [...ys].sort((a, b) => b - a);
}

const empty = (label) => ({ label, trips: 0, mins: 0, home: 0, away: 0, stayMins: 0 });

const at = (d, t) => new Date(`${d}T${t || "00:00"}:00`);

// Stay time, in minutes, per calendar day: [{ person, date, mins }].
//  - Only nights AWAY from home count. Home days never add to the totals.
//  - A night away counts a full 24 h by default.
//  - But when a trip later leaves that same city, the stay is the real time from ARRIVING until that
//    departure (arrive Mumbai 26 Oct 21:00, train leaves 27 Oct 06:00 = 9 h), and that time is
//    split over the calendar days it actually covers (3 h on the 26th, 6 h on the 27th).
export function stayMinutes(travel, stay) {
  const away = stay.filter((s) => s.type !== "Home");
  const mins = new Map(away.map((s) => [`${s.person}|${s.date}`, 1440]));
  const add = (key, m) => mins.set(key, (mins.get(key) || 0) + m);
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
      const from = at(t.aDate, t.aTime);
      const to = at(next.dDate, next.dTime);
      if (!(to > from)) continue;
      // the nights away logged in that city from the arrival date up to the day before the next departure
      const nights = away.filter((s) => s.person === person && s.city === t.destination && s.date >= t.aDate && s.date < next.dDate);
      if (!nights.length) continue;
      nights.forEach((s) => mins.set(`${s.person}|${s.date}`, 0));
      for (let d = parseDate(t.aDate); toDateStr(d) <= next.dDate; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        const dayEnd = new Date(d);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const m = Math.round((Math.min(to, dayEnd) - Math.max(from, dayStart)) / 60000);
        if (m > 0) add(`${person}|${toDateStr(d)}`, m);
      }
    }
  }
  return [...mins]
    .map(([k, m]) => ({ person: k.slice(0, k.lastIndexOf("|")), date: k.slice(k.lastIndexOf("|") + 1), mins: m }))
    .filter((x) => x.mins > 0);
}

// Everything the Insights tables need for one year (or "all"). A logged stay counts as 1 day.
export function summarize({ travel, stay, year, month = "all" }) {
  const byDay = year !== "all" && month !== "all";
  const inScope = (d) => (year === "all" || yearOf(d) === year) && (!byDay || monthOf(d) === month);
  const stayList = stayMinutes(travel, stay).filter((x) => inScope(x.date));
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
    if (s.type === "Home") return; // home days are not part of the totals
    slot(...keyOf(s.date)).away += 1;
  });
  stayList.forEach((x) => (slot(...keyOf(x.date)).stayMins += x.mins));
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
  stayList.forEach((x) => (person(x.person).stayMins += x.mins));
  const people = [...pp.values()].sort((a, b) => b.mins + b.stayMins - (a.mins + a.stayMins));

  return { rows: list, totals, modes, places, cities, people };
}
