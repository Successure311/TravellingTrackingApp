import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAll } from "../lib/api.js";
import { getOutbox, subscribeOutbox } from "../lib/outbox.js";
import { HAS_BACKEND } from "../config.js";
import { canonicalCity, registerPlaces } from "../data/indianCities.js";
import { minutesBetween } from "../lib/time.js";
import { normPerson } from "../lib/person.js";

const CACHE_KEY = "wayfarer_cache_v1";
const POLL_MS = 8000; // how often an open app re-reads the sheet

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Sheets may hand back "9:30" or "9:30:00" even for text cells: always normalise to HH:mm.
const normTime = (v) => {
  const m = String(v ?? "").match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
};

// A date typed by hand in the sheet may be "26/10/2026" or "26-10-2026": always turn it into yyyy-MM-dd.
const normDate = (v) => {
  const t = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // day first, as in India
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : t;
};

// Duration is not stored in the sheet: it is worked out from the depart/arrival date and time.
const normTravel = (r) => {
  const dTime = normTime(r.DepartTime);
  const aTime = normTime(r.ArrivalTime);
  const dDate = normDate(r.DepartDate);
  const aDate = normDate(r.ArrivalDate);
  return {
    id: String(r.Id),
    person: normPerson(r.Person) || "Unassigned",
    mode: r.Mode,
    source: canonicalCity(r.Source),
    dDate,
    dTime,
    destination: canonicalCity(r.Destination),
    aDate,
    aTime,
    mins: Math.max(0, num(minutesBetween(dDate, dTime, aDate, aTime))),
  };
};
const normStay = (r) => ({ person: normPerson(r.Person) || "Unassigned", date: normDate(r.Date), type: r.Type, city: canonicalCity(r.City) });

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || null;
  } catch {
    return null;
  }
}

export function useData() {
  const cached = useRef(loadCache()).current;
  const [server, setServer] = useState(cached ? { people: [], ...cached } : { travel: [], stay: [], people: [] });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const [outbox, setOutbox] = useState(getOutbox());
  const inFlight = useRef(false);
  const lastSig = useRef(cached ? JSON.stringify(cached) : "");

  useEffect(() => subscribeOutbox(setOutbox), []);

  const refresh = useCallback(async (fresh = false, silent = false) => {
    if (!HAS_BACKEND) {
      setLoading(false);
      setError("Add your Apps Script URL in src/config.js");
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const out = await fetchAll(fresh);
      const data = { travel: (out.travel || []).map(normTravel), stay: (out.stay || []).map(normStay), people: (out.people || []).map((r) => normPerson(r.Name)).filter(Boolean) };
      const sig = JSON.stringify(data);
      setError(null);
      // only touch the screen when something really changed in the sheet
      if (sig !== lastSig.current) {
        lastSig.current = sig;
        setServer(data);
        try {
          localStorage.setItem(CACHE_KEY, sig);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      if (!silent) setError(e.message || "Could not load data");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // opening the app, coming back to it, or regaining signal: read the sheet fresh right away
    const now = () => document.visibilityState === "visible" && refresh(true, true);
    refresh(true);
    document.addEventListener("visibilitychange", now);
    window.addEventListener("focus", now);
    window.addEventListener("online", now);
    window.addEventListener("pageshow", now);
    // while open: keep checking. Every save and every sheet edit clears the server's 30 s copy, so
    // this light check always sees the latest and many devices do not overload the script.
    const poll = setInterval(() => document.visibilityState === "visible" && refresh(false, true), POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", now);
      window.removeEventListener("focus", now);
      window.removeEventListener("online", now);
      window.removeEventListener("pageshow", now);
      clearInterval(poll);
    };
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
      else if (item.kind === "stayDelete") s.delete(`${item.row.person}|${item.row.date}`);
      else if (item.kind === "stay") s.set(`${item.row.person}|${item.row.date}`, item.row);
    }
    return { travel: [...t.values()], stay: [...s.values()] };
  }, [server, outbox]);

  // everyone: names saved in the People tab, names on trips and stays, and names just added here
  const people = useMemo(
    () =>
      [...new Set([...server.people, ...outbox.filter((o) => o.kind === "person").map((o) => o.row.name), ...travel.map((t) => t.person), ...stay.map((s) => s.person)])]
        .filter((p) => p !== "Unassigned")
        .sort(),
    [server, outbox, travel, stay]
  );

  useEffect(() => {
    registerPlaces([...travel.flatMap((t) => [t.source, t.destination]), ...stay.map((s) => s.city)]);
  }, [travel, stay]);

  return { travel, stay, people, loading, error, pending: outbox.length, refresh };
}
