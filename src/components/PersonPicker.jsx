import { useEffect, useRef, useState } from "react";
import { Sheet } from "./Pickers.jsx";
import { useConfirm } from "./ConfirmDialog.jsx";
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
export default function PersonPicker({ people, value, onChange, label = "Traveller", allowAll = false, canAdd = true, onRemove }) {
  const [open, setOpen] = useState(false);
  const [confirm, confirmUI] = useConfirm();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const wrap = useRef(null);

  useEffect(() => {
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const list = value && value !== "all" && !people.includes(value) ? [...people, value] : people;
  const everyone = (size) => (
    <span className="display flex shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold" style={{ width: size, height: size }}>
      All
    </span>
  );

  const add = () => {
    const name = normPerson(draft, list);
    if (!name) return;
    onChange(name);
    setDraft("");
    setAdding(false);
    setOpen(false);
  };

  const startAdding = () => {
    setOpen(false);
    setDraft("");
    setAdding(true);
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
        onClick={() => (canAdd && list.length === 0 ? startAdding() : setOpen((o) => !o))}
        className="flex h-14 w-full items-center gap-3 rounded-xl border border-line bg-night/60 px-3 text-left active:border-sky"
        style={{ borderColor: open ? "var(--color-sky)" : undefined }}
      >
        {value === "all" ? (
          <>
            {everyone(32)}
            <span className="display flex-1 truncate text-lg font-bold">Everyone</span>
          </>
        ) : value ? (
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
          {allowAll && (
            <button
              type="button"
              onClick={() => pick("all")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left active:bg-deck"
              style={{ background: value === "all" ? "rgba(56,189,248,.12)" : undefined }}
            >
              {everyone(28)}
              <span className="flex-1 text-[15px]">Everyone</span>
              {value === "all" && <span className="text-sky">✓</span>}
            </button>
          )}
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
              {onRemove && (
                <span
                  role="button"
                  aria-label={`Remove ${p}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (await confirm(`Remove "${p}" from the list?

Their saved trips and stays stay safe in your Google Sheet.`, { confirmLabel: "Remove" })) {
                      onRemove(p);
                      setOpen(false);
                    }
                  }}
                  className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-mist active:bg-white/10 active:text-rose-400"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                  </svg>
                </span>
              )}
            </button>
          ))}

          {canAdd && (
            <button type="button" onClick={startAdding} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-dawn">
              + Add new traveller
            </button>
          )}
        </div>
      )}

      {adding && (
        <Sheet title="New traveller" onClose={() => setAdding(false)} aboveKeyboard>
          <div className="flex items-center gap-2 rounded-xl border border-sky bg-night px-3">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
              type="text"
              inputMode="text"
              enterKeyHint="done"
              placeholder="Traveller name"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-mist/50"
            />
            <button
              type="button"
              onClick={add}
              disabled={!draft.trim()}
              className="display rounded-lg px-4 py-1.5 text-sm font-bold text-night disabled:opacity-35"
              style={{ background: "linear-gradient(90deg,#ff7a59,#ffc46b)" }}
            >
              Add
            </button>
          </div>
        </Sheet>
      )}
      {confirmUI}
    </div>
  );
}
