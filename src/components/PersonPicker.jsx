import { useEffect, useRef, useState } from "react";
import { initial, normPerson, personColor } from "../lib/person.js";

export function Avatar({ name, size = 28 }) {
  const c = personColor(name);
  return (
    <span
      className="display flex shrink-0 items-center justify-center rounded-full font-bold text-night"
      style={{ width: size, height: size, background: c, fontSize: size * 0.46 }}
    >
      {initial(name)}
    </span>
  );
}

// Who is travelling: a dropdown of every added name, with "+ Add new traveller" at the bottom.
export default function PersonPicker({ people, value, onChange, label = "Traveller" }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const wrap = useRef(null);

  useEffect(() => {
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const list = value && !people.includes(value) ? [...people, value] : people;
  const showInput = adding || list.length === 0;

  const add = () => {
    const name = normPerson(draft, list);
    if (!name) return;
    onChange(name);
    setDraft("");
    setAdding(false);
    setOpen(false);
  };

  const pick = (p) => {
    onChange(p);
    setOpen(false);
    setAdding(false);
  };

  return (
    <div ref={wrap} className="relative">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-full items-center gap-3 rounded-xl border border-line bg-night/60 px-3 text-left active:border-sky"
        style={{ borderColor: open ? "var(--color-sky)" : undefined }}
      >
        {value ? (
          <>
            <Avatar name={value} size={32} />
            <span className="display flex-1 truncate text-lg font-bold">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-mist/60">Select or add traveller</span>
        )}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-mist transition" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-deck-2 p-1 shadow-2xl shadow-black/50">
          {list.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left active:bg-deck"
              style={{ background: p === value ? "rgba(56,189,248,.12)" : undefined }}
            >
              <Avatar name={p} />
              <span className="flex-1 text-[15px]">{p}</span>
              {p === value && <span className="text-sky">✓</span>}
            </button>
          ))}

          {!showInput && (
            <button type="button" onClick={() => setAdding(true)} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-dawn">
              + Add new traveller
            </button>
          )}

          {showInput && (
            <div className="flex gap-2 p-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
                placeholder="Traveller name"
                autoCapitalize="words"
                className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-night/60 px-3 text-base text-white outline-none placeholder:text-mist/50 focus:border-sky"
              />
              <button
                type="button"
                onClick={add}
                disabled={!draft.trim()}
                className="display rounded-xl px-5 font-bold text-night disabled:opacity-35"
                style={{ background: "linear-gradient(90deg,#ff7a59,#ffc46b)" }}
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
