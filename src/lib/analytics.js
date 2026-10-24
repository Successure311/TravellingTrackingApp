import { MONTHS, parseDate, toDateStr } from "./time.js";

const yearOf = (s) => Number(s.slice(0, 4));

export function availableYears(travel, stay) {
  const ys = new Set([new Date().getFullYear()]);
  travel.forEach((t) => ys.add(yearOf(t.dDate)));
  stay.forEach((s) => ys.add(yearOf(s.date)));
  return [...ys].sort((a, b) => b - a);
}

// minutes of each trip, split across the calendar days it spans (key: yyyy-MM-dd)
function spreadByDay(trips) {
  const map = {};
  for (const t of trips) {
    let cur = new Date(`${t.dDate}T${t.dTime}:00`);
    const end = new Date(`${t.aDate}T${t.aTime}:00`);
    if (!(end > cur)) continue;
    while (cur < end) {
      const nextMid = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      const stop = nextMid < end ? nextMid : end;
      const k = toDateStr(cur);
      map[k] = (map[k] || 0) + (stop - cur) / 60000;
      cur = stop;
    }
  }
  return map;
}

const top = (obj, n) =>
  Object.entries(obj)
    .sort((a, b) => b[1].count - a[1].count || b[1].mins - a[1].mins)
    .slice(0, n);

export function analyse({ travel, stay, year, mode }) {
  const inYear = (d) => year === "all" || yearOf(d) === year;
  const trips = travel.filter((t) => inYear(t.dDate) && (mode === "all" || t.mode === mode) && t.mins > 0);
  const stays = stay.filter((s) => inYear(s.date));

  const totalMins = trips.reduce((a, t) => a + t.mins, 0);
  const byMode = { Flight: 0, Train: 0, Car: 0 };
  trips.forEach((t) => (byMode[t.mode] = (byMode[t.mode] || 0) + t.mins));
  const favMode = Object.entries(byMode).sort((a, b) => b[1] - a[1])[0];

  const cities = new Set();
  trips.forEach((t) => {
    cities.add(t.source);
    cities.add(t.destination);
  });
  stays.filter((s) => s.type !== "Home").forEach((s) => cities.add(s.city));

  const longest = trips.reduce((b, t) => (!b || t.mins > b.mins ? t : b), null);
  const nightsAway = stays.filter((s) => s.type !== "Home").length;
  const nightsHome = stays.length - nightsAway;

  // previous-year comparison (only meaningful for a single year)
  let prevMins = null;
  if (year !== "all") {
    prevMins = travel
      .filter((t) => yearOf(t.dDate) === year - 1 && (mode === "all" || t.mode === mode))
      .reduce((a, t) => a + t.mins, 0);
  }

  // hours per month (selected year) or per year (all)
  let series;
  if (year === "all") {
    const ys = [...new Set(trips.map((t) => yearOf(t.dDate)))].sort();
    series = ys.map((y) => ({ label: String(y), Flight: 0, Train: 0, Car: 0 }));
    trips.forEach((t) => (series.find((r) => r.label === String(yearOf(t.dDate)))[t.mode] += t.mins / 60));
  } else {
    series = MONTHS.map((m) => ({ label: m, Flight: 0, Train: 0, Car: 0 }));
    trips.forEach((t) => (series[Number(t.dDate.slice(5, 7)) - 1][t.mode] += t.mins / 60));
  }
  series.forEach((r) => {
    r.Flight = +r.Flight.toFixed(1);
    r.Train = +r.Train.toFixed(1);
    r.Car = +r.Car.toFixed(1);
  });

  // stay nights per month / year
  let stayRows;
  if (year === "all") {
    const ys = [...new Set(stays.map((s) => yearOf(s.date)))].sort();
    stayRows = ys.map((y) => ({ label: String(y), Home: 0, Outside: 0 }));
    stays.forEach((s) => (stayRows.find((r) => r.label === String(yearOf(s.date)))[s.type === "Home" ? "Home" : "Outside"]++));
  } else {
    stayRows = MONTHS.map((m) => ({ label: m, Home: 0, Outside: 0 }));
    stays.forEach((s) => stayRows[Number(s.date.slice(5, 7)) - 1][s.type === "Home" ? "Home" : "Outside"]++);
  }

  // places and routes
  const places = {};
  trips.forEach((t) => {
    const p = (places[t.destination] ||= { count: 0, mins: 0 });
    p.count++;
    p.mins += t.mins;
  });
  stays
    .filter((s) => s.type !== "Home")
    .forEach((s) => {
      const p = (places[s.city] ||= { count: 0, mins: 0 });
      p.nights = (p.nights || 0) + 1;
    });
  const topCities = top(places, 7).map(([name, v]) => ({ name, visits: v.count, hours: +(v.mins / 60).toFixed(1), nights: v.nights || 0 }));

  const routes = {};
  trips.forEach((t) => {
    const k = `${t.source} to ${t.destination}`;
    const r = (routes[k] ||= { count: 0, mins: 0, mode: t.mode });
    r.count++;
    r.mins += t.mins;
  });
  const topRoutes = top(routes, 5).map(([name, v]) => ({ name, count: v.count, hours: +(v.mins / 60).toFixed(1), mode: v.mode }));

  // calendar heatmap for the chosen year (latest year with data when "all")
  const dataYears = [...travel.map((t) => yearOf(t.dDate)), ...stay.map((s) => yearOf(s.date))];
  const hy = year === "all" ? (dataYears.length ? Math.max(...dataYears) : new Date().getFullYear()) : year;
  const dayMins = spreadByDay(travel.filter((t) => yearOf(t.dDate) === hy || yearOf(t.aDate) === hy).filter((t) => mode === "all" || t.mode === mode));
  const stayMap = Object.fromEntries(stay.map((s) => [s.date, s.type === "Home" ? "Home" : "Outside"]));
  const jan1 = new Date(hy, 0, 1);
  const days = [];
  for (let i = 0; i < jan1.getDay(); i++) days.push(null);
  for (let d = new Date(hy, 0, 1); d.getFullYear() === hy; d.setDate(d.getDate() + 1)) {
    const k = toDateStr(d);
    days.push({ k, mins: dayMins[k] || 0, stay: stayMap[k] || null });
  }

  return {
    trips,
    totalMins,
    byMode,
    favMode: favMode && favMode[1] > 0 ? favMode[0] : null,
    cityCount: cities.size,
    cityList: [...cities].sort(),
    longest,
    nightsAway,
    nightsHome,
    prevMins,
    series,
    stayRows,
    topCities,
    topRoutes,
    heat: { year: hy, days },
  };
}

export { parseDate };
