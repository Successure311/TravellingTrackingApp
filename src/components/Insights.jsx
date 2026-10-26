import { useMemo, useState } from "react";
import PersonPicker, { Avatar } from "./PersonPicker.jsx";
import { MODES } from "./Icons.jsx";
import { summarize, yearsOf } from "../lib/summary.js";
import { fmtDuration, splitDuration } from "../lib/time.js";

const TH = "py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-mist first:text-left";
const TD = "mono py-2.5 text-right text-[13px] first:text-left";

// travel time + stay days as "2d 3h" (24 h rolls into a new day)
const dh = (mins) => {
  if (!mins) return "–";
  const { d, h } = splitDuration(mins);
  return d ? `${d}d ${h}h` : `${h}h`;
};
const num = (n) => (n ? n : "–");

function Card({ title, children }) {
  return (
    <section className="rise rounded-3xl border border-line bg-deck p-4">
      <h3 className="display mb-1 text-base font-bold">{title}</h3>
      {children}
    </section>
  );
}

export default function Insights({ travel: allTravel, stay: allStay, people, person, loading }) {
  const [who, setWho] = useState(person || "all");
  const effectiveWho = who === "all" || people.includes(who) || !people.length ? who : "all";
  const pick = (list) => (effectiveWho === "all" ? list : list.filter((x) => x.person === effectiveWho));
  const travel = useMemo(() => pick(allTravel), [allTravel, effectiveWho]);
  const stay = useMemo(() => pick(allStay), [allStay, effectiveWho]);

  const years = useMemo(() => yearsOf(travel, stay), [travel, stay]);
  const [year, setYear] = useState(null);
  const thisYear = new Date().getFullYear();
  const activeYear = year === "all" || years.includes(year) ? year : years[0] ?? thisYear;

  const s = useMemo(() => summarize({ travel, stay, year: activeYear }), [travel, stay, activeYear]);
  const everyone = useMemo(() => summarize({ travel: allTravel, stay: allStay, year: activeYear }), [allTravel, allStay, activeYear]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[90, 200, 120].map((h, i) => (
          <div key={i} className="skeleton rounded-3xl" style={{ height: h }} />
        ))}
      </div>
    );
  }

  const stayDays = s.totals.home + s.totals.away;
  const total = splitDuration(s.totals.mins + stayDays * 1440);
  const unit = "mx-1 text-lg font-medium text-white/80";

  return (
    <div className="space-y-4">
      {/* filters: traveller and year */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-3">
        <PersonPicker people={people} value={effectiveWho} onChange={setWho} allowAll canAdd={false} />
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">Year</span>
          <select
            value={activeYear}
            onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="display h-14 w-full rounded-xl border border-line bg-night/60 px-3 text-lg font-bold text-white outline-none focus:border-sky"
          >
            <option value="all">All</option>
            {[...new Set([...years, thisYear])].sort((a, b) => b - a).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* total */}
      <div className="rise rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #1d6fd1, #3b9bf0 60%, #ffc46b)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Total time · journeys + stays</p>
        <p className="display mt-1 text-5xl font-bold leading-none text-white">
          {total.d > 0 && (
            <>
              {total.d}
              <span className={unit}>{total.d === 1 ? "day" : "days"}</span>
            </>
          )}
          {total.h}
          <span className={unit}>h</span>
          {total.m > 0 && <span className="text-lg font-medium text-white/80">{total.m} min</span>}
        </p>
        <p className="mono mt-2 text-sm text-white/90">
          Journeys {fmtDuration(s.totals.mins)} + Stay {stayDays} {stayDays === 1 ? "day" : "days"}
        </p>
      </div>

      {s.rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-mist">No trips or stays logged for this selection yet.</p>
      ) : (
        <>
          {/* main table */}
          <Card title={activeYear === "all" ? "By year" : `By month · ${activeYear}`}>
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${TH} w-[17%]`}>{activeYear === "all" ? "Year" : "Month"}</th>
                  <th className={`${TH} w-[13%]`}>Trips</th>
                  <th className={`${TH} w-[20%]`}>Travel</th>
                  <th className={`${TH} w-[13%]`} style={{ color: "#fb923c" }}>Home</th>
                  <th className={`${TH} w-[13%]`} style={{ color: "#a78bfa" }}>Away</th>
                  <th className={`${TH} w-[24%]`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.label} className="border-b border-line/60">
                    <td className={`${TD} font-semibold`}>{r.label}</td>
                    <td className={TD}>{num(r.trips)}</td>
                    <td className={TD}>{r.mins ? fmtDuration(r.mins) : "–"}</td>
                    <td className={TD}>{num(r.home)}</td>
                    <td className={TD}>{num(r.away)}</td>
                    <td className={`${TD} font-bold text-sky`}>{dh(r.mins + (r.home + r.away) * 1440)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className={`${TD} font-bold`}>All</td>
                  <td className={`${TD} font-bold`}>{s.totals.trips}</td>
                  <td className={`${TD} font-bold`}>{fmtDuration(s.totals.mins)}</td>
                  <td className={`${TD} font-bold`}>{s.totals.home}</td>
                  <td className={`${TD} font-bold`}>{s.totals.away}</td>
                  <td className={`${TD} font-bold`} style={{ color: "#ffc46b" }}>
                    {dh(s.totals.mins + stayDays * 1440)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-2 text-[11px] text-mist">Travel = hours on the move. Home / Away = days stayed. Total = travel + stay days, 24 h rolls into a new day.</p>
          </Card>

          {/* by mode */}
          <Card title="By mode">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${TH} w-[40%]`}>Mode</th>
                  <th className={`${TH} w-[20%]`}>Trips</th>
                  <th className={`${TH} w-[40%]`}>Travel</th>
                </tr>
              </thead>
              <tbody>
                {s.modes.map((m) => {
                  const M = MODES[m.mode];
                  return (
                    <tr key={m.mode} className="border-b border-line/60 last:border-0">
                      <td className={TD}>
                        <span className="flex items-center gap-2 font-sans text-sm" style={{ color: M.color }}>
                          <M.Icon width={18} height={18} /> {m.mode}
                        </span>
                      </td>
                      <td className={TD}>{num(m.trips)}</td>
                      <td className={TD}>{m.mins ? fmtDuration(m.mins) : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* top places */}
          <Card title="Top places">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${TH} w-[40%]`}>Place</th>
                  <th className={`${TH} w-[20%]`}>Arrivals</th>
                  <th className={`${TH} w-[20%]`}>Nights</th>
                  <th className={`${TH} w-[20%]`}>Travel</th>
                </tr>
              </thead>
              <tbody>
                {s.places.slice(0, 5).map((p) => (
                  <tr key={p.name} className="border-b border-line/60 last:border-0">
                    <td className={`${TD} truncate font-sans text-sm`}>{p.name}</td>
                    <td className={TD}>{num(p.arrivals)}</td>
                    <td className={TD}>{num(p.nights)}</td>
                    <td className={TD}>{p.mins ? fmtDuration(p.mins) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* per traveller, only when looking at everyone */}
      {effectiveWho === "all" && everyone.people.length > 1 && (
        <Card title="By traveller">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={`${TH} w-[34%]`}>Traveller</th>
                <th className={`${TH} w-[16%]`}>Trips</th>
                <th className={`${TH} w-[24%]`}>Travel</th>
                <th className={`${TH} w-[26%]`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {everyone.people.map((p) => (
                <tr key={p.name} className="border-b border-line/60 last:border-0">
                  <td className={TD}>
                    <span className="flex items-center gap-2 font-sans text-sm">
                      <Avatar name={p.name} size={22} />
                      <span className="truncate">{p.name}</span>
                    </span>
                  </td>
                  <td className={TD}>{num(p.trips)}</td>
                  <td className={TD}>{p.mins ? fmtDuration(p.mins) : "–"}</td>
                  <td className={`${TD} font-bold text-sky`}>{dh(p.mins + p.days * 1440)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
