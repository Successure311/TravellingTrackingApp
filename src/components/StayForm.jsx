import { useMemo, useState } from "react";
import BigCalendar from "./BigCalendar.jsx";
import CityInput from "./CityInput.jsx";
import PersonPicker from "./PersonPicker.jsx";
import { HomeIcon, TentIcon, TrashIcon } from "./Icons.jsx";
import { enqueue } from "../lib/outbox.js";
import { pushRecent } from "../lib/recent.js";
import { addCustomPlace, canonicalCity } from "../data/indianCities.js";
import { datesBetween, fmtDay, todayStr } from "../lib/time.js";

const TYPES = {
  Home: { label: "Home", color: "#fb923c", Icon: HomeIcon, sub: "Slept at home" },
  Outside: { label: "Outside Home", color: "#a78bfa", Icon: TentIcon, sub: "Slept elsewhere" },
};

export default function StayForm({ stays, people, person, setPerson, onRemovePerson, notify }) {
  const [date, setDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [rangeMode, setRangeMode] = useState(false); // off: tapping a day picks that one day (as always)
  const [calKey, setCalKey] = useState(0); // remounts the calendar after each save so it starts fresh
  const [type, setType] = useState("Outside");
  const [city, setCity] = useState("");

  const mine = useMemo(() => stays.filter((s) => s.person === person), [stays, person]);
  const byDate = useMemo(() => Object.fromEntries(mine.map((s) => [s.date, s])), [mine]);
  const marks = useMemo(() => Object.fromEntries(mine.map((s) => [s.date, s.type])), [mine]);
  const lastHome = useMemo(() => {
    const homes = mine.filter((s) => s.type === "Home" && s.city).sort((a, b) => b.date.localeCompare(a.date));
    return homes[0]?.city || "";
  }, [mine]);

  const dates = useMemo(() => datesBetween(date, endDate), [date, endDate]);
  const isRange = dates.length > 1;
  const existingDays = dates.filter((d) => byDate[d]);
  const existing = existingDays.length > 0;

  // tap one day: a day that already has an entry shows it, so it can be edited, otherwise blank.
  // tap a second day: the whole range is selected and what you typed is kept.
  const pickRange = (a, b) => {
    setDate(a);
    setEndDate(b);
    if (a !== b) return;
    const found = byDate[a];
    if (found) {
      setType(found.type === "Home" ? "Home" : "Outside");
      setCity(found.city);
    } else {
      setType("Outside");
      setCity("");
    }
  };

  const resetForm = () => {
    setDate(todayStr());
    setEndDate(todayStr());
    setType("Outside");
    setCity("");
    setPerson("");
    setRangeMode(false);
    setCalKey((k) => k + 1);
  };

  const toggleRange = () => {
    if (rangeMode) setEndDate(date); // switching back: keep just the first day
    setRangeMode(!rangeMode);
  };

  const pickType = (t) => {
    setType(t);
    if (t === "Home" && !city && lastHome) setCity(lastHome);
  };

  const ready = person && date && city.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    if (isRange && existingDays.length && !window.confirm(`${existingDays.length} of these ${dates.length} days already have a stay.\n\nReplace them?`)) return;
    const cityName = canonicalCity(city);
    // one entry per day in the range
    dates.forEach((d, i) =>
      enqueue({
        key: `stay-${d}-${Date.now()}-${i}`,
        kind: "stay",
        row: { person, date: d, type, city: cityName },
        payload: { sheet: "Stay", action: "upsert", key_columns: ["Person", "Date"], row: { Person: person, Date: d, Type: type, City: cityName } },
      })
    );
    pushRecent(cityName);
    addCustomPlace(cityName);
    const when = isRange ? `${fmtDay(date)} to ${fmtDay(endDate)}` : fmtDay(date);
    notify(`${when}: ${type === "Home" ? "Home" : "Outside"}, ${cityName}${isRange ? ` (${dates.length} days)` : ""}`);
    resetForm();
  };

  const remove = () => {
    if (!existing) return;
    const ask = existingDays.length === 1 ? `Delete the stay on ${fmtDay(existingDays[0])} (${byDate[existingDays[0]].city})?` : `Delete ${existingDays.length} stays between ${fmtDay(date)} and ${fmtDay(endDate)}?`;
    if (!window.confirm(ask)) return;
    existingDays.forEach((d, i) =>
      enqueue({
        key: `stay-del-${person}-${d}-${Date.now()}-${i}`,
        kind: "stayDelete",
        row: { person, date: d },
        payload: { sheet: "Stay", action: "delete", key_columns: ["Person", "Date"], row: { Person: person, Date: d } },
      })
    );
    notify(existingDays.length === 1 ? `Stay on ${fmtDay(existingDays[0])} deleted` : `${existingDays.length} stays deleted`);
    resetForm();
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

      <div>
        <button
          type="button"
          onClick={toggleRange}
          aria-pressed={rangeMode}
          className="mb-2 flex items-center gap-3 rounded-full border py-1.5 pl-3 pr-2 text-sm font-semibold transition active:scale-95"
          style={{ borderColor: rangeMode ? "var(--color-dawn)" : "var(--color-line)", color: rangeMode ? "var(--color-dawn)" : "var(--color-mist)", background: rangeMode ? "rgba(255,196,107,.12)" : "transparent" }}
        >
          Date range
          <span className="relative h-5 w-9 rounded-full transition" style={{ background: rangeMode ? "var(--color-dawn)" : "var(--color-line)" }}>
            <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: rangeMode ? "1.1rem" : "0.125rem" }} />
          </span>
        </button>
        <BigCalendar
          key={`${calKey}-${rangeMode}`}
          value={date}
          marks={marks}
          {...(rangeMode ? { end: endDate, onRange: pickRange } : { onChange: (d) => pickRange(d, d) })}
        />
      </div>

      <div className="rounded-2xl border border-line bg-deck p-4">
        <CityInput
          label={isRange ? `City · ${fmtDay(date)} to ${fmtDay(endDate)} · ${dates.length} days` : `City on ${fmtDay(date)}`}
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
        {isRange ? `Save ${dates.length} days` : existing ? "Update stay" : "Save stay"}
      </button>
    </form>
  );
}
