import { useState } from "react";
import { parseDate, toDateStr, todayStr } from "../lib/time.js";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Large month calendar. `marks` maps yyyy-MM-dd to "Home" | "Outside" for the coloured dots.
// With `onRange(start, end)` it selects a range: tap a start date, then an end date.
export default function BigCalendar({ value, onChange, marks, min, legend = true, end, onRange }) {
  const sel = parseDate(value || todayStr());
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const today = todayStr();
  // true once the user has tapped a start day, so the NEXT tap extends it into a range
  const [anchored, setAnchored] = useState(false);

  const first = new Date(view.y, view.m, 1);
  const lead = first.getDay();
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  const shift = (d) =>
    setView((v) => {
      const n = new Date(v.y, v.m + d, 1);
      return { y: n.getFullYear(), m: n.getMonth() };
    });

  const jumpToday = () => {
    const t = new Date();
    setView({ y: t.getFullYear(), m: t.getMonth() });
    pick(todayStr());
  };

  const pick = (ds) => {
    if (!onRange) return onChange(ds);
    const single = !end || end === value;
    if (anchored && single && ds !== value) {
      ds > value ? onRange(value, ds) : onRange(ds, value);
      setAnchored(false);
    } else {
      onRange(ds, ds); // first tap, a range already set, or the same day again: start from this day
      setAnchored(true);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-deck p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="h-11 w-11 rounded-full border border-line text-xl">
          ‹
        </button>
        <div className="text-center">
          <p className="display text-xl font-bold">{FULL_MONTHS[view.m]}</p>
          <p className="mono text-xs text-mist">{view.y}</p>
        </div>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="h-11 w-11 rounded-full border border-line text-xl">
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-mist">
        {DAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const ds = toDateStr(new Date(view.y, view.m, day));
          const isSel = ds === value || (!!end && ds === end);
          const inRange = !!end && ds > value && ds < end;
          const isToday = ds === today;
          const mark = marks[ds];
          const blocked = min && ds < min;
          const dot = mark === "Home" ? "var(--color-home)" : mark === "Outside" ? "var(--color-away)" : null;
          return (
            <button
              key={i}
              type="button"
              disabled={blocked}
              onClick={() => pick(ds)}
              className="relative flex aspect-square flex-col items-center justify-center rounded-2xl text-lg font-medium transition active:scale-90 disabled:opacity-25"
              style={{
                background: isSel ? "linear-gradient(135deg, var(--color-dusk), var(--color-dawn))" : inRange ? "rgba(255,196,107,.2)" : "transparent",
                color: isSel ? "#0a1224" : undefined,
                border: isToday && !isSel ? "1.5px solid var(--color-sky)" : "1.5px solid transparent",
                fontWeight: isSel ? 700 : 500,
              }}
            >
              {day}
              {dot && <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full" style={{ background: isSel ? "#0a1224" : dot }} />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-mist">
        {legend ? (
          <span className="flex items-center gap-3">
            <i className="inline-block h-2 w-2 rounded-full bg-home" /> Home
            <i className="inline-block h-2 w-2 rounded-full bg-away" /> Outside
          </span>
        ) : (
          <span />
        )}
        <button type="button" onClick={jumpToday} className="rounded-full border border-line px-3 py-1 text-sky">
          Today
        </button>
      </div>
    </div>
  );
}
