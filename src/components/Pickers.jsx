import { useEffect, useRef, useState } from "react";
import BigCalendar from "./BigCalendar.jsx";
import { parseDate, MONTHS } from "../lib/time.js";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist";
const trigger =
  "flex h-14 w-full items-center justify-between rounded-xl border border-line bg-night/60 px-3 text-left text-white active:border-sky";

// The part of the screen that is actually visible: it shrinks when the phone keyboard opens.
function useVisibleArea(enabled) {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) return;
    const update = () => setBox({ top: vv.offsetTop, left: vv.offsetLeft, width: vv.width, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);
  return box;
}

// aboveKeyboard: the window sits just above the on-screen keyboard instead of behind it.
function Sheet({ title, onClose, children, aboveKeyboard = false }) {
  const box = useVisibleArea(aboveKeyboard);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const floating = aboveKeyboard && box;
  return (
    <div
      className={`z-[60] flex items-end justify-center bg-black/60 ${floating ? "fixed" : "fixed inset-0"}`}
      style={floating ? { top: box.top, left: box.left, width: box.width, height: box.height } : undefined}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`toast-in w-full max-w-md border border-line bg-night p-4 ${aboveKeyboard ? "mx-2 mb-2 rounded-3xl" : "safe-bottom rounded-t-3xl"}`}
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
            legend={false}
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
  const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  return { hh: String(h % 12 === 0 ? 12 : h % 12), mm: m[2], pm: h >= 12 };
};
export const fmt12 = (hhmm) => {
  const t = to12(hhmm);
  return t ? `${t.hh}:${t.mm} ${t.pm ? "PM" : "AM"}` : "";
};

export function TimeField({ label, value, onChange, accent = "#38bdf8" }) {
  const [open, setOpen] = useState(false);
  const [hh, setHh] = useState("");
  const [mm, setMm] = useState("");
  const [pm, setPm] = useState(false);
  const mmRef = useRef(null);
  const hhRef = useRef(null);

  const openSheet = () => {
    const cur = to12(value);
    if (cur) {
      setHh(cur.hh);
      setMm(cur.mm);
      setPm(cur.pm);
    } else {
      const n = new Date();
      setHh(String(n.getHours() % 12 || 12));
      setMm(String(n.getMinutes()).padStart(2, "0"));
      setPm(n.getHours() >= 12);
    }
    setOpen(true);
    setTimeout(() => hhRef.current?.select(), 80);
  };

  const hNum = Number(hh);
  const mNum = Number(mm);
  const valid = hh !== "" && mm !== "" && hNum >= 1 && hNum <= 12 && mNum >= 0 && mNum <= 59;

  const onHour = (raw) => {
    let v = raw.replace(/\D/g, "").slice(0, 2);
    // typed 24-hour value (13-23): convert to 12-hour and flip to PM
    if (v.length === 2 && Number(v) >= 13 && Number(v) <= 23) {
      v = String(Number(v) - 12);
      setPm(true);
    } else if (v === "00") {
      v = "12";
      setPm(false);
    }
    setHh(v);
    // hour is complete: jump to minutes (2 digits, or a single digit that cannot start a valid hour)
    if (v.length === 2 || (v.length === 1 && Number(v) > 1)) mmRef.current?.focus();
  };

  const onMin = (raw) => {
    let v = raw.replace(/\D/g, "").slice(0, 2);
    if (v.length === 1 && Number(v) > 5) v = "0" + v; // "7" -> 07
    setMm(v);
  };

  const done = () => {
    if (!valid) return;
    const h24 = (hNum % 12) + (pm ? 12 : 0);
    onChange(`${String(h24).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`);
    setOpen(false);
  };

  const ampm = (on) => ({
    background: on ? "linear-gradient(135deg, var(--color-dusk), var(--color-dawn))" : "var(--color-deck)",
    color: on ? "#0a1224" : undefined,
    borderColor: on ? "transparent" : "var(--color-line)",
    fontWeight: on ? 700 : 500,
  });

  const box =
    "display h-20 w-[4.5rem] rounded-2xl border border-line bg-deck text-center text-5xl font-bold text-white outline-none focus:border-sky";

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
        <Sheet title={label} onClose={() => setOpen(false)} aboveKeyboard>
          <div className="mb-5 flex items-center justify-center gap-3">
            <input
              ref={hhRef}
              autoFocus
              value={hh}
              onChange={(e) => onHour(e.target.value)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="next"
              placeholder="HH"
              aria-label="Hour"
              className={box}
            />
            <span className="display text-4xl font-bold text-mist">:</span>
            <input
              ref={mmRef}
              value={mm}
              onChange={(e) => onMin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && mm === "") hhRef.current?.focus();
                if (e.key === "Enter") {
                  e.preventDefault();
                  done();
                }
              }}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="done"
              placeholder="MM"
              aria-label="Minutes"
              className={box}
            />
            <div className="ml-1 flex flex-col gap-2">
              {[false, true].map((isPm) => (
                <button key={String(isPm)} type="button" onClick={() => setPm(isPm)} className="h-[38px] w-16 rounded-xl border text-base" style={ampm(pm === isPm)}>
                  {isPm ? "PM" : "AM"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={done}
            disabled={!valid}
            className="display h-14 w-full rounded-2xl text-lg font-bold text-night transition active:scale-[0.98] disabled:opacity-35"
            style={{ background: `linear-gradient(90deg, ${accent}, #ffc46b)` }}
          >
            {valid ? `Set ${hNum}:${String(mNum).padStart(2, "0")} ${pm ? "PM" : "AM"}` : "Enter hour and minutes"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
