import { useEffect, useMemo, useRef, useState } from "react";
import { searchCities } from "../data/indianCities.js";
import { getRecent } from "../lib/recent.js";
import { PinIcon } from "./Icons.jsx";

export default function CityInput({ label, value, onChange, accent = "#38bdf8", placeholder = "Search city..." }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);

  const results = useMemo(() => searchCities(value), [value]);
  const recent = useMemo(() => (open && !value ? getRecent() : []), [open, value]);
  const exact = results.some((c) => c.name.toLowerCase() === value.trim().toLowerCase());
  const showCustom = value.trim().length > 1 && !exact;

  useEffect(() => {
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const pick = (name) => {
    onChange(name);
    setOpen(false);
  };

  const onKey = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      pick(results[active].name);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrap} className="relative">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-night/60 px-3 focus-within:border-sky" style={{ "--tw-ring-color": accent }}>
        <PinIcon width={18} height={18} style={{ color: accent }} />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="words"
          className="h-12 w-full bg-transparent text-base text-white outline-none placeholder:text-mist/50"
        />
        {value && (
          <button type="button" aria-label="Clear" onClick={() => onChange("")} className="px-1 text-mist">
            ×
          </button>
        )}
      </div>

      {open && (results.length > 0 || showCustom || recent.length > 0) && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-deck-2 p-1 shadow-2xl shadow-black/50">
          {recent.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2">
              <span className="w-full text-[10px] uppercase tracking-widest text-mist">Recent</span>
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => pick(r)} className="rounded-full border border-line px-3 py-1 text-sm">
                  {r}
                </button>
              ))}
            </div>
          )}
          {results.map((c, i) => (
            <button
              key={c.name + c.state}
              type="button"
              onClick={() => pick(c.name)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ${i === active ? "bg-deck" : ""}`}
            >
              <span className="text-[15px] text-white">{c.name}</span>
              <span className="text-xs text-mist">{c.state}</span>
            </button>
          ))}
          {showCustom && (
            <button type="button" onClick={() => pick(value.trim())} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-dawn">
              + Add "{value.trim()}" as a new place
            </button>
          )}
        </div>
      )}
    </div>
  );
}
