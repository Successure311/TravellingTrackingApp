import { useMemo, useState } from "react";
import { searchCities } from "../data/indianCities.js";
import { getRecent } from "../lib/recent.js";
import { PinIcon } from "./Icons.jsx";
import { Sheet } from "./Pickers.jsx";

// A place box. Tapping it opens a small window just above the keyboard with what you are typing
// and the suggestions, so the text is never hidden behind the keyboard.
export default function CityInput({ label, value, onChange, accent = "#38bdf8", placeholder = "Search city...", trailing = null }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => searchCities(draft, 6), [draft]);
  const recent = useMemo(() => (open && !draft ? getRecent() : []), [open, draft]);
  const exact = results.some((c) => c.name.toLowerCase() === draft.trim().toLowerCase());
  const showCustom = draft.trim().length > 1 && !exact;

  const openSheet = () => {
    setDraft(value);
    setActive(0);
    setOpen(true);
  };
  const choose = (name) => {
    onChange(name);
    setOpen(false);
  };
  // closing keeps whatever was typed
  const close = () => {
    const t = draft.trim();
    if (t && t !== value) onChange(t);
    setOpen(false);
  };
  const submit = () => {
    if (results[active]) choose(results[active].name);
    else if (draft.trim()) choose(draft.trim());
    else setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
  };

  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-night/60 px-3">
        <button type="button" onClick={openSheet} className="flex h-12 min-w-0 flex-1 items-center gap-2 text-left">
          <PinIcon width={18} height={18} style={{ color: accent }} className="shrink-0" />
          {value ? <span className="truncate text-base text-white">{value}</span> : <span className="text-base text-mist/50">{placeholder}</span>}
        </button>
        {value && (
          <button type="button" aria-label="Clear" onClick={() => onChange("")} className="px-1 text-mist">
            ×
          </button>
        )}
        {trailing}
      </div>

      {open && (
        <Sheet title={label} onClose={close} aboveKeyboard>
          <div className="mb-3 max-h-44 overflow-auto">
            {recent.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                <span className="w-full text-[10px] uppercase tracking-widest text-mist">Recent</span>
                {recent.map((r) => (
                  <button key={r} type="button" onClick={() => choose(r)} className="rounded-full border border-line px-3 py-1 text-sm">
                    {r}
                  </button>
                ))}
              </div>
            )}
            {results.map((c, i) => (
              <button
                key={c.name + c.state}
                type="button"
                onClick={() => choose(c.name)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ${i === active ? "bg-deck" : ""}`}
              >
                <span className="text-[15px] text-white">{c.name}</span>
                <span className="text-xs text-mist">{c.state}</span>
              </button>
            ))}
            {showCustom && (
              <button type="button" onClick={() => choose(draft.trim())} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-dawn">
                + Add "{draft.trim()}" as a new place
              </button>
            )}
            {!draft && recent.length === 0 && <p className="px-1 py-2 text-sm text-mist">Type a city or state</p>}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-sky bg-night px-3">
            <PinIcon width={18} height={18} style={{ color: accent }} className="shrink-0" />
            <input
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              onFocus={(e) => e.target.select()}
              type="text"
              inputMode="text"
              enterKeyHint="done"
              placeholder={placeholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-mist/50"
            />
            {draft && (
              <button type="button" aria-label="Clear text" onClick={() => setDraft("")} className="px-1 text-mist">
                ×
              </button>
            )}
            <button type="button" onClick={submit} className="display rounded-lg px-3 py-1.5 text-sm font-bold text-night" style={{ background: "linear-gradient(90deg,#ff7a59,#ffc46b)" }}>
              Done
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
