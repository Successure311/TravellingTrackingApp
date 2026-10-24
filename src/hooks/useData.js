import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAll } from "../lib/api.js";
import { getOutbox, subscribeOutbox } from "../lib/outbox.js";
import { HAS_BACKEND } from "../config.js";
import { canonicalCity } from "../data/indianCities.js";
import { minutesBetween } from "../lib/time.js";
import { normPerson } from "../lib/person.js";

const CACHE_KEY = "wayfarer_cache_v1";

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Sheets may hand back "9:30" or "9:30:00" even for text cells: always normalise to HH:mm.
const normTime = (v) => {
  const m = String(v ?? "").match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
};

// Duration is not stored in the sheet: it is worked out from the depart/arrival date and time.
const normTravel = (r) => {
  const dTime = normTime(r.DepartTime);
  const aTime = normTime(r.ArrivalTime);
  return {
    id: String(r.Id),
    person: normPerson(r.Person) || "Unassigned",
    mode: r.Mode,
    source: canonicalCity(r.Source),
    dDate: r.DepartDate,
    dTime,
    destination: canonicalCity(r.Destination),
    aDate: r.ArrivalDate,
    aTime,
    mins: Math.max(0, num(minutesBetween(r.DepartDate, dTime, r.ArrivalDate, aTime))),
  };
};
const normStay = (r) => ({ person: normPerson(r.Person) || "Unassigned", date: r.Date, type: r.Type, city: canonicalCity(r.City) });

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || null;
  } catch {
    return null;
  }
}

export function useData() {
  const cached = useRef(loadCache()).current;
  const [server, setServer] = useState(cached || { travel: [], stay: [] });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const [outbox, setOutbox] = useState(getOutbox());
  const inFlight = useRef(false);

  useEffect(() => subscribeOutbox(setOutbox), []);

  const refresh = useCallback(async (fresh = false) => {
    if (!HAS_BACKEND) {
      setLoading(false);
      setError("Add your Apps Script URL in src/config.js");
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const out = await fetchAll(fresh);
      const data = { travel: (out.travel || []).map(normTravel), stay: (out.stay || []).map(normStay) };
      setServer(data);
      setError(null);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e.message || "Could not load data");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  // when the outbox drains, pull the canonical rows
  const prevLen = useRef(outbox.length);
  useEffect(() => {
    if (prevLen.current > 0 && outbox.length === 0) refresh(true);
    prevLen.current = outbox.length;
  }, [outbox, refresh]);

  // server rows + not-yet-synced local rows
  const { travel, stay } = useMemo(() => {
    const t = new Map(server.travel.map((r) => [r.id, r]));
    const s = new Map(server.stay.map((r) => [`${r.person}|${r.date}`, r]));
    for (const item of outbox) {
      if (item.kind === "travel") t.set(item.row.id, item.row);
      else if (item.kind === "delete") t.delete(item.id);
      else if (item.kind === "stay") s.set(`${item.row.person}|${item.row.date}`, item.row);
    }
    return { travel: [...t.values()], stay: [...s.values()] };
  }, [server, outbox]);

  const people = useMemo(
    () => [...new Set([...travel.map((t) => t.person), ...stay.map((s) => s.person)])].filter((p) => p !== "Unassigned").sort(),
    [travel, stay]
  );

  return { travel, stay, people, loading, error, pending: outbox.length, refresh };
}
