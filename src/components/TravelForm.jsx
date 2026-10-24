import { useMemo, useState } from "react";
import CityInput from "./CityInput.jsx";
import { MODES, PlaneIcon, SwapIcon, TrashIcon, ReturnIcon } from "./Icons.jsx";
import { enqueue } from "../lib/outbox.js";
import { pushRecent } from "../lib/recent.js";
import { fmtDay, fmtDuration, minutesBetween, todayStr, uid } from "../lib/time.js";

const field = "h-12 w-full rounded-xl border border-line bg-night/60 px-3 text-base text-white outline-none focus:border-sky";
const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist";

export default function TravelForm({ trips, notify }) {
  const [mode, setMode] = useState("Flight");
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [dDate, setDDate] = useState(todayStr());
  const [dTime, setDTime] = useState("");
  const [aDate, setADate] = useState(todayStr());
  const [aTime, setATime] = useState("");
  const accent = MODES[mode].color;

  const mins = useMemo(() => minutesBetween(dDate, dTime, aDate, aTime), [dDate, dTime, aDate, aTime]);
  const timeError = mins != null && mins <= 0 ? "Arrival must be after departure" : null;
  const ready = source.trim() && dest.trim() && dDate && dTime && aDate && aTime && mins > 0;

  const swap = () => {
    setSource(dest);
    setDest(source);
  };

  const onDepartDate = (v) => {
    setDDate(v);
    if (!aDate || aDate < v) setADate(v);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    const id = uid();
    const row = { id, mode, source: source.trim(), dDate, dTime, destination: dest.trim(), aDate, aTime, mins };
    enqueue({
      key: id,
      kind: "travel",
      row,
      payload: {
        sheet: "Travel",
        row: {
          Id: id,
          CreatedAt: new Date().toISOString(),
          Mode: mode,
          Source: row.source,
          DepartDate: dDate,
          DepartTime: dTime,
          Destination: row.destination,
          ArrivalDate: aDate,
          ArrivalTime: aTime,
          DurationMins: mins,
        },
      },
    });
    pushRecent(row.source, row.destination);
    notify(`${mode} logged: ${row.source} to ${row.destination} (${fmtDuration(mins)})`);
    // keep mode and dates so a multi-leg day is quick to enter
    setSource(row.destination);
    setDest("");
    setDDate(aDate);
    setDTime("");
    setATime("");
  };

  const returnTrip = (t) => {
    setMode(t.mode);
    setSource(t.destination);
    setDest(t.source);
    setDDate(todayStr());
    setADate(todayStr());
    setDTime("");
    setATime("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (t) => {
    enqueue({ key: `del-${t.id}`, kind: "delete", id: t.id, payload: { sheet: "Travel", action: "delete", id: t.id } });
    notify("Trip removed");
  };

  const recent = [...trips].sort((a, b) => (b.dDate + b.dTime).localeCompare(a.dDate + a.dTime)).slice(0, 6);

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="ticket rise" style={{ "--notch": "176px" }}>
        {/* mode */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {Object.entries(MODES).map(([key, m]) => {
            const on = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className="flex flex-col items-center gap-1 rounded-2xl border py-3 transition active:scale-95"
                style={{
                  borderColor: on ? m.color : "var(--color-line)",
                  background: on ? `${m.color}22` : "transparent",
                  color: on ? m.color : "var(--color-mist)",
                }}
              >
                <m.Icon width={26} height={26} />
                <span className="display text-sm font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* route */}
        <div className="space-y-3 px-4 pb-5">
          <CityInput label="From" value={source} onChange={setSource} accent={accent} placeholder="Source city" />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <button type="button" onClick={swap} aria-label="Swap" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist active:rotate-180">
              <SwapIcon width={16} height={16} />
            </button>
            <div className="h-px flex-1 bg-line" />
          </div>
          <CityInput label="To" value={dest} onChange={setDest} accent={accent} placeholder="Destination city" />
        </div>

        <div className="perf mx-5" />

        {/* times */}
        <div className="grid grid-cols-2 gap-3 p-4 pt-5">
          <div>
            <span className={lbl}>Departs date</span>
            <input type="date" value={dDate} onChange={(e) => onDepartDate(e.target.value)} className={field} />
          </div>
          <div>
            <span className={lbl}>Departs time</span>
            <input type="time" value={dTime} onChange={(e) => setDTime(e.target.value)} className={field} />
          </div>
          <div>
            <span className={lbl}>Arrival date</span>
            <input type="date" value={aDate} min={dDate} onChange={(e) => setADate(e.target.value)} className={field} />
          </div>
          <div>
            <span className={lbl}>Arrival time</span>
            <input type="time" value={aTime} onChange={(e) => setATime(e.target.value)} className={field} />
          </div>
        </div>

        <div className="px-4 pb-4">
          <div
            className="mono mb-3 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
            style={{ background: `${accent}18`, color: timeError ? "#fb7185" : accent }}
          >
            <span className="flex items-center gap-2">
              <PlaneIcon width={18} height={18} /> {timeError || "Journey time"}
            </span>
            <span className="text-lg font-bold">{mins > 0 ? fmtDuration(mins) : "--"}</span>
          </div>
          <button
            type="submit"
            disabled={!ready}
            className="display h-14 w-full rounded-2xl text-lg font-bold text-night transition active:scale-[0.98] disabled:opacity-35"
            style={{ background: `linear-gradient(90deg, ${accent}, #ffc46b)` }}
          >
            Save journey
          </button>
        </div>
      </form>

      {recent.length > 0 && (
        <section>
          <h2 className="display mb-2 px-1 text-sm font-bold uppercase tracking-widest text-mist">Recent journeys</h2>
          <ul className="space-y-2">
            {recent.map((t) => {
              const m = MODES[t.mode] || MODES.Flight;
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-line bg-deck p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${m.color}22`, color: m.color }}>
                    <m.Icon width={22} height={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">
                      {t.source} <span className="text-mist">to</span> {t.destination}
                    </p>
                    <p className="mono text-xs text-mist">
                      {fmtDay(t.dDate)} · {fmtDuration(t.mins)}
                    </p>
                  </div>
                  <button onClick={() => returnTrip(t)} aria-label="Return journey" className="p-2 text-mist active:text-sky">
                    <ReturnIcon width={20} height={20} />
                  </button>
                  <button onClick={() => remove(t)} aria-label="Delete" className="p-2 text-mist active:text-rose-400">
                    <TrashIcon width={20} height={20} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
