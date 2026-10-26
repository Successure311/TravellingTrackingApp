import { useMemo, useState } from "react";
import BigCalendar from "./BigCalendar.jsx";
import CityInput from "./CityInput.jsx";
import PersonPicker from "./PersonPicker.jsx";
import { HomeIcon, TentIcon, TrashIcon } from "./Icons.jsx";
import { enqueue } from "../lib/outbox.js";
import { pushRecent } from "../lib/recent.js";
import { addCustomPlace, canonicalCity } from "../data/indianCities.js";
import { fmtDay, todayStr } from "../lib/time.js";

const TYPES = {
  Home: { label: "Home", color: "#fb923c", Icon: HomeIcon, sub: "Slept at home" },
  Outside: { label: "Outside Home", color: "#a78bfa", Icon: TentIcon, sub: "Slept elsewhere" },
};

export default function StayForm({ stays, people, person, setPerson, onRemovePerson, notify }) {
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState("Outside");
  const [city, setCity] = useState("");

  const mine = useMemo(() => stays.filter((s) => s.person === person), [stays, person]);
  const byDate = useMemo(() => Object.fromEntries(mine.map((s) => [s.date, s])), [mine]);
  const marks = useMemo(() => Object.fromEntries(mine.map((s) => [s.date, s.type])), [mine]);
  const lastHome = useMemo(() => {
    const homes = mine.filter((s) => s.type === "Home" && s.city).sort((a, b) => b.date.localeCompare(a.date));
    return homes[0]?.city || "";
  }, [mine]);

  // tapping a day that already has an entry shows it, so it can be edited
  const pickDate = (d) => {
    setDate(d);
    const existing = byDate[d];
    if (existing) {
      setType(existing.type === "Home" ? "Home" : "Outside");
      setCity(existing.city);
    } else {
      // a day with no entry yet: start blank
      setType("Outside");
      setCity("");
    }
  };

  const pickType = (t) => {
    setType(t);
    if (t === "Home" && !city && lastHome) setCity(lastHome);
  };

  const ready = person && date && city.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    const row = { person, date, type, city: canonicalCity(city) };
    enqueue({
      key: `stay-${date}-${Date.now()}`,
      kind: "stay",
      row,
      payload: { sheet: "Stay", action: "upsert", key_columns: ["Person", "Date"], row: { Person: person, Date: date, Type: type, City: row.city } },
    });
    pushRecent(row.city);
    addCustomPlace(row.city);
    notify(`${fmtDay(date)}: ${type === "Home" ? "Home" : "Outside"}, ${row.city}`);
    // back to a blank form for the next entry
    setDate(todayStr());
    setType("Outside");
    setCity("");
    setPerson("");
  };

  const existing = byDate[date];

  const remove = () => {
    if (!existing || !window.confirm(`Delete the stay on ${fmtDay(date)} (${existing.city})?`)) return;
    enqueue({
      key: `stay-del-${person}-${date}-${Date.now()}`,
      kind: "stayDelete",
      row: { person, date },
      payload: { sheet: "Stay", action: "delete", key_columns: ["Person", "Date"], row: { Person: person, Date: date } },
    });
    notify(`Stay on ${fmtDay(date)} deleted`);
    setDate(todayStr());
    setType("Outside");
    setCity("");
    setPerson("");
  };

  const accent = TYPES[type].color;

  return (
    <form onSubmit={submit} className="space-y-4 rise">
      <div className="rounded-2xl border border-line bg-deck p-4">
        <PersonPicker people={people} value={person} onChange={setPerson} onRemove={onRemovePerson} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(TYPES).map(([key, t]) => {
          const on = type === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => pickType(key)}
              className="rounded-2xl border p-4 text-left transition active:scale-95"
              style={{ borderColor: on ? t.color : "var(--color-line)", background: on ? `${t.color}20` : "var(--color-deck)", color: on ? t.color : undefined }}
            >
              <t.Icon width={30} height={30} />
              <p className="display mt-2 text-lg font-bold">{t.label}</p>
              <p className="text-xs text-mist">{t.sub}</p>
            </button>
          );
        })}
      </div>

      <BigCalendar value={date} onChange={pickDate} marks={marks} />

      <div className="rounded-2xl border border-line bg-deck p-4">
        <CityInput
          label={`City on ${fmtDay(date)}`}
          value={city}
          onChange={setCity}
          accent={accent}
          placeholder="Where did you stay?"
          trailing={
            existing && (
              <button type="button" onClick={remove} aria-label="Delete this stay" className="-mr-1 border-l border-line pl-2 text-mist active:text-rose-400">
                <TrashIcon width={20} height={20} />
              </button>
            )
          }
        />
      </div>

      <button
        type="submit"
        disabled={!ready}
        className="display h-14 w-full rounded-2xl text-lg font-bold text-night transition active:scale-[0.98] disabled:opacity-35"
        style={{ background: `linear-gradient(90deg, ${accent}, #ffc46b)` }}
      >
        {existing ? "Update stay" : "Save stay"}
      </button>
    </form>
  );
}
