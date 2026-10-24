import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyse, availableYears } from "../lib/analytics.js";
import { fmtDuration, MONTHS, fmtDay } from "../lib/time.js";
import { MODES, PinIcon } from "./Icons.jsx";
import PersonPicker, { Avatar } from "./PersonPicker.jsx";
import { personColor } from "../lib/person.js";

const MODE_COLORS = { Flight: "#38bdf8", Train: "#fbbf24", Car: "#34d399" };
const tip = { background: "#17264a", border: "1px solid #263559", borderRadius: 12, color: "#e8eefc", fontSize: 13 };
const axis = { fill: "#8fa0c4", fontSize: 11 };

function Card({ title, sub, children, className = "" }) {
  return (
    <section className={`rise rounded-3xl border border-line bg-deck p-4 ${className}`}>
      <h3 className="display text-base font-bold">{title}</h3>
      {sub && <p className="mb-3 text-xs text-mist">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Empty({ text = "No data yet for this filter" }) {
  return <p className="py-8 text-center text-sm text-mist">{text}</p>;
}

function Kpi({ label, value, unit, color, foot }) {
  return (
    <div className="rise rounded-2xl border border-line bg-deck p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-mist">{label}</p>
      <p className="display mt-1 text-[28px] font-bold leading-none" style={{ color }}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-mist">{unit}</span>}
      </p>
      {foot && <p className="mt-1.5 truncate text-xs text-mist">{foot}</p>}
    </div>
  );
}

export default function Insights({ travel: allTravel, stay: allStay, people, person, loading }) {
  // main filter: one traveller (default: the one currently selected in the forms) or everyone
  const [who, setWho] = useState(person || "all");
  const effectiveWho = who === "all" || people.includes(who) || !people.length ? who : "all";
  const travel = useMemo(() => (effectiveWho === "all" ? allTravel : allTravel.filter((t) => t.person === effectiveWho)), [allTravel, effectiveWho]);
  const stay = useMemo(() => (effectiveWho === "all" ? allStay : allStay.filter((s) => s.person === effectiveWho)), [allStay, effectiveWho]);

  const years = useMemo(() => availableYears(travel, stay), [travel, stay]);
  const [year, setYear] = useState(years[0]);
  const [mode, setMode] = useState("all");

  const a = useMemo(() => analyse({ travel, stay, year, mode }), [travel, stay, year, mode]);
  const byPerson = useMemo(() => {
    const m = {};
    a.trips.forEach((t) => {
      const p = (m[t.person] ||= { name: t.person, hours: 0, trips: 0 });
      p.hours += t.mins / 60;
      p.trips += 1;
    });
    return Object.values(m)
      .map((p) => ({ ...p, hours: +p.hours.toFixed(1) }))
      .sort((x, y) => y.hours - x.hours);
  }, [a]);
  const hours = a.totalMins / 60;
  const delta = a.prevMins ? Math.round(((a.totalMins - a.prevMins) / a.prevMins) * 100) : null;
  const modeData = Object.entries(a.byMode)
    .filter(([, v]) => v > 0)
    .map(([name, v]) => ({ name, value: +(v / 60).toFixed(1) }));
  const awayPct = a.nightsAway + a.nightsHome ? Math.round((a.nightsAway / (a.nightsAway + a.nightsHome)) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-3">
        {[120, 220, 220].map((h, i) => (
          <div key={i} className="skeleton rounded-3xl" style={{ height: h }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* traveller: the main filter */}
      <PersonPicker people={people} value={effectiveWho} onChange={setWho} allowAll canAdd={false} />

      {/* filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...years].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`mono shrink-0 rounded-full border px-4 py-2 text-sm ${year === y ? "border-transparent bg-white text-night" : "border-line text-mist"}`}
          >
            {y === "all" ? "All years" : y}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {["all", "Flight", "Train", "Car"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 rounded-xl border py-2 text-sm font-medium"
            style={{
              borderColor: mode === m ? MODE_COLORS[m] || "#fff" : "var(--color-line)",
              color: mode === m ? MODE_COLORS[m] || "#fff" : "var(--color-mist)",
              background: mode === m ? `${MODE_COLORS[m] || "#ffffff"}18` : "transparent",
            }}
          >
            {m === "all" ? "All modes" : m}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rise col-span-2 overflow-hidden rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #1d6fd1, #3b9bf0 60%, #ffc46b)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
            {effectiveWho === "all" ? "Everyone" : effectiveWho} · time in transit
          </p>
          <p className="display mt-1 text-5xl font-bold text-white">
            {hours.toFixed(hours >= 100 ? 0 : 1)}
            <span className="ml-1 text-xl font-medium text-white/80">hours</span>
          </p>
          <p className="mono mt-1 text-sm text-white/90">
            {(hours / 24).toFixed(1)} days · {a.trips.length} journeys
            {delta != null && ` · ${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs ${year - 1}`}
          </p>
        </div>
        <Kpi label="Cities" value={a.cityCount} color="#ffc46b" foot="places touched" />
        <Kpi label="Nights away" value={a.nightsAway} color="#a78bfa" foot={`${awayPct}% of logged nights`} />
        <Kpi label="Nights home" value={a.nightsHome} color="#fb923c" foot="at home" />
        <Kpi
          label="Longest"
          value={a.longest ? fmtDuration(a.longest.mins) : "--"}
          color={a.longest ? MODE_COLORS[a.longest.mode] : undefined}
          foot={a.longest ? `${a.longest.source} to ${a.longest.destination}` : "no trips"}
        />
      </div>

      {/* per traveller, only when looking at everyone */}
      {effectiveWho === "all" && byPerson.length > 1 && (
        <Card title="By traveller" sub="Hours in transit">
          <ul className="space-y-2.5">
            {byPerson.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <Avatar name={p.name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{p.name}</span>
                    <span className="mono text-mist">
                      {p.hours}h · {p.trips} trips
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-night">
                    <div className="h-full rounded-full" style={{ width: `${(p.hours / byPerson[0].hours) * 100}%`, background: personColor(p.name) }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* hours by month/year */}
      <Card title={year === "all" ? "Travel hours by year" : `Travel hours by month · ${year}`} sub="Stacked by mode">
        {a.trips.length ? (
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={a.series} margin={{ left: -18, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="#263559" strokeDasharray="3 4" />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} unit="h" />
                <Tooltip contentStyle={tip} cursor={{ fill: "#ffffff10" }} formatter={(v, n) => [`${v}h`, n]} />
                <Bar dataKey="Flight" stackId="a" fill={MODE_COLORS.Flight} />
                <Bar dataKey="Train" stackId="a" fill={MODE_COLORS.Train} />
                <Bar dataKey="Car" stackId="a" fill={MODE_COLORS.Car} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      {/* mode donut */}
      <Card title="How you travel" sub="Hours per mode">
        {modeData.length ? (
          <div className="flex items-center gap-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={modeData} dataKey="value" innerRadius={44} outerRadius={70} paddingAngle={3} stroke="none">
                    {modeData.map((d) => (
                      <Cell key={d.name} fill={MODE_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tip} formatter={(v) => `${v}h`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2">
              {modeData.map((d) => {
                const M = MODES[d.name];
                return (
                  <li key={d.name} className="flex items-center gap-2">
                    <M.Icon width={18} height={18} style={{ color: M.color }} />
                    <span className="flex-1 text-sm">{d.name}</span>
                    <span className="mono text-sm" style={{ color: M.color }}>
                      {d.value}h
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      {/* top cities */}
      <Card title="Top destinations" sub="By number of arrivals">
        {a.topCities.length ? (
          <div style={{ height: a.topCities.length * 40 + 10 }}>
            <ResponsiveContainer>
              <BarChart data={a.topCities} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={86} tick={{ ...axis, fill: "#e8eefc", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: "#ffffff10" }} formatter={(v, n, p) => [`${v} arrivals · ${p.payload.hours}h · ${p.payload.nights} nights`, ""]} />
                <Bar dataKey="visits" radius={[0, 8, 8, 0]} fill="#ffc46b" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      {/* routes */}
      <Card title="Favourite routes">
        {a.topRoutes.length ? (
          <ul className="space-y-2">
            {a.topRoutes.map((r, i) => {
              const M = MODES[r.mode] || MODES.Flight;
              return (
                <li key={r.name} className="flex items-center gap-3 rounded-xl bg-night/50 p-3">
                  <span className="mono w-5 text-center text-sm text-mist">{i + 1}</span>
                  <M.Icon width={18} height={18} style={{ color: M.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                  <span className="mono text-xs text-mist">
                    {r.count}× · {r.hours}h
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty />
        )}
      </Card>

      {/* stay split */}
      <Card title="Home vs away" sub="Nights logged">
        {a.nightsAway + a.nightsHome ? (
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={a.stayRows} margin={{ left: -22, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="#263559" strokeDasharray="3 4" />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: "#ffffff10" }} />
                <Bar dataKey="Home" stackId="s" fill="#fb923c" />
                <Bar dataKey="Outside" stackId="s" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      {/* heatmap */}
      <Card title={`Year at a glance · ${a.heat.year}`} sub="Blue = travel day, violet = away, orange = home">
        <Heatmap days={a.heat.days} />
      </Card>

      {/* city chips */}
      <Card title="Cities visited" sub={`${a.cityList.length} places`}>
        {a.cityList.length ? (
          <div className="flex flex-wrap gap-2">
            {a.cityList.map((c) => (
              <span key={c} className="flex items-center gap-1 rounded-full border border-line bg-night/50 px-3 py-1 text-sm">
                <PinIcon width={13} height={13} className="text-dusk" /> {c}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Card>
    </div>
  );
}

function Heatmap({ days }) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const color = (d) => {
    if (!d) return "transparent";
    if (d.mins > 0) {
      const o = Math.min(1, 0.4 + d.mins / 60 / 10);
      return `rgba(56,189,248,${o})`;
    }
    if (d.stay === "Outside") return "rgba(167,139,250,.6)";
    if (d.stay === "Home") return "rgba(251,146,60,.35)";
    return "#17264a";
  };
  const monthAt = (w) => {
    const d = w.find(Boolean);
    return d && d.k.slice(8) <= "07" ? MONTHS[Number(d.k.slice(5, 7)) - 1] : "";
  };
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-[3px]" style={{ minWidth: weeks.length * 14 }}>
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            <span className="mono h-3 text-[9px] leading-3 text-mist">{monthAt(w)}</span>
            {Array.from({ length: 7 }, (_, i) => w[i] ?? null).map((d, di) => (
              <span
                key={di}
                title={d ? `${fmtDay(d.k)}${d.mins ? ` · ${fmtDuration(Math.round(d.mins))}` : ""}${d.stay ? ` · ${d.stay}` : ""}` : ""}
                className="h-[11px] w-[11px] rounded-[3px]"
                style={{ background: color(d) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
