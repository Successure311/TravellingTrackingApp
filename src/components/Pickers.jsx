import { useEffect, useState } from "react";
import BigCalendar from "./BigCalendar.jsx";
import { parseDate, MONTHS } from "../lib/time.js";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist";
const trigger =
  "flex h-14 w-full items-center justify-between rounded-xl border border-line bg-night/60 px-3 text-left text-white active:border-sky";

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="toast-in safe-bottom w-full max-w-md rounded-t-3xl border border-line bg-night p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="display text-lg font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full border border-line text-mist">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const CalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export function DateField({ label, value, onChange, min, accent = "#38bdf8" }) {
  const [open, setOpen] = useState(false);
  const d = value ? parseDate(value) : null;
  return (
    <div>
      <span className={lbl}>{label}</span>
      <button type="button" className={trigger} onClick={() => setOpen(true)}>
        <span>
          {d ? (
            <>
              <span className="display text-lg font-bold">
                {d.getDate()} {MONTHS[d.getMonth()]}
              </span>
              <span className="mono ml-2 text-xs text-mist">
                {WEEK[d.getDay()]} {d.getFullYear()}
              </span>
            </>
          ) : (
            <span className="text-mist/60">Select date</span>
          )}
        </span>
        <span style={{ color: accent }}>
          <CalIcon />
        </span>
      </button>
      {open && (
        <Sheet title={label} onClose={() => setOpen(false)}>
          <BigCalendar
            value={value}
            min={min}
            marks={{}}
            onChange={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

const to12 = (hhmm) => {
  const [h, m] = (hhmm || "").split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return { h: h % 12 === 0 ? 12 : h % 12, m, pm: h >= 12 };
};
const to24 = ({ h, m, pm }) => `${String((h % 12) + (pm ? 12 : 0)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
export const fmt12 = (hhmm) => {
  const t = to12(hhmm);
  return t ? `${t.h}:${String(t.m).padStart(2, "0")} ${t.pm ? "PM" : "AM"}` : "";
};

export function TimeField({ label, value, onChange, accent = "#38bdf8" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ h: 9, m: 0, pm: false });

  const openSheet = () => {
    const cur = to12(value);
    if (cur) setDraft(cur);
    else {
      const n = new Date();
      setDraft({ h: n.getHours() % 12 || 12, m: Math.round(n.getMinutes() / 5) * 5 % 60, pm: n.getHours() >= 12 });
    }
    setOpen(true);
  };

  const done = () => {
    onChange(to24(draft));
    setOpen(false);
  };

  const btn = (on) => ({
    background: on ? "linear-gradient(135deg, var(--color-dusk), var(--color-dawn))" : "var(--color-deck)",
    color: on ? "#0a1224" : undefined,
    borderColor: on ? "transparent" : "var(--color-line)",
    fontWeight: on ? 700 : 500,
  });

  return (
    <div>
      <span className={lbl}>{label}</span>
      <button type="button" className={trigger} onClick={openSheet}>
        {value ? (
          <span className="display text-lg font-bold">
            {fmt12(value).split(" ")[0]}
            <span className="ml-1.5 text-sm font-medium" style={{ color: accent }}>
              {fmt12(value).split(" ")[1]}
            </span>
          </span>
        ) : (
          <span className="text-mist/60">Select time</span>
        )}
        <span style={{ color: accent }}>
          <ClockIcon />
        </span>
      </button>

      {open && (
        <Sheet title={label} onClose={() => setOpen(false)}>
          {/* big readout + AM/PM */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <p className="display text-5xl font-bold">
              {draft.h}:{String(draft.m).padStart(2, "0")}
            </p>
            <div className="flex flex-col gap-1.5">
              {[false, true].map((pm) => (
                <button
                  key={String(pm)}
                  type="button"
                  onClick={() => setDraft({ ...draft, pm })}
                  className="h-10 w-16 rounded-xl border text-base"
                  style={btn(draft.pm === pm)}
                >
                  {pm ? "PM" : "AM"}
                </button>
              ))}
            </div>
          </div>

          <p className={lbl}>Hour</p>
          <div className="mb-3 grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <button key={h} type="button" onClick={() => setDraft({ ...draft, h })} className="mono h-11 rounded-xl border text-base" style={btn(draft.h === h)}>
                {h}
              </button>
            ))}
          </div>

          <p className={lbl}>Minutes</p>
          <div className="mb-2 grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
              <button key={m} type="button" onClick={() => setDraft({ ...draft, m })} className="mono h-11 rounded-xl border text-base" style={btn(draft.m === m)}>
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-center gap-3 text-sm text-mist">
            Fine tune
            <button type="button" onClick={() => setDraft({ ...draft, m: (draft.m + 59) % 60 })} className="h-9 w-14 rounded-xl border border-line text-white">
              −1
            </button>
            <button type="button" onClick={() => setDraft({ ...draft, m: (draft.m + 1) % 60 })} className="h-9 w-14 rounded-xl border border-line text-white">
              +1
            </button>
          </div>

          <button
            type="button"
            onClick={done}
            className="display h-14 w-full rounded-2xl text-lg font-bold text-night active:scale-[0.98]"
            style={{ background: `linear-gradient(90deg, ${accent}, #ffc46b)` }}
          >
            Set {draft.h}:{String(draft.m).padStart(2, "0")} {draft.pm ? "PM" : "AM"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
