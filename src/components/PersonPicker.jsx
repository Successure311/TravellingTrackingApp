import { useState } from "react";
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

// Who is travelling: chips for known people plus "+ New" to add a name.
export default function PersonPicker({ people, value, onChange, label = "Traveller" }) {
  const [adding, setAdding] = useState(people.length === 0);
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = normPerson(draft, people);
    if (!name) return;
    onChange(name);
    setDraft("");
    setAdding(false);
  };

  // a person just added locally is not in `people` until it syncs: show it anyway
  const list = value && !people.includes(value) ? [...people, value] : people;

  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">{label}</span>
      <div className="flex flex-wrap gap-2">
        {list.map((p) => {
          const on = p === value;
          const c = personColor(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[15px] transition active:scale-95"
              style={{ borderColor: on ? c : "var(--color-line)", background: on ? `${c}22` : "transparent", color: on ? "#fff" : "var(--color-mist)", fontWeight: on ? 600 : 500 }}
            >
              <Avatar name={p} />
              {p}
            </button>
          );
        })}
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-sky">
            + New
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus={list.length > 0}
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
  );
}
