import { useMemo, useRef, useState } from "react";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { INDIA_PATH, MAP_H, MAP_W, project } from "../data/indiaMap.js";
import { INDIA_GEO, WORLD_GEO } from "../data/worldGeo.js";
import { coordsOf, isAbroad } from "../data/cityCoords.js";
import { fmtDuration } from "../lib/time.js";

const MODE_COLORS = { Flight: "#38bdf8", Train: "#fbbf24", Car: "#34d399" };
const GOLD = "#ffc46b";
const HOME = "#fb923c";
const GRAT = geoGraticule10();
const GLOBE = 320;
const R = 142;
const INDIA_VIEW = [-78.5, -21];

// places (with counts) and routes from the trips / stays being analysed
function collect(trips, stays) {
  const places = new Map();
  const unmapped = new Set();
  const get = (name) => {
    if (places.has(name)) return places.get(name);
    const c = coordsOf(name);
    if (!c) {
      unmapped.add(name);
      return null;
    }
    const p = { name, lat: c[0], lon: c[1], abroad: isAbroad(name), visits: 0, nights: 0, home: false, hours: 0 };
    places.set(name, p);
    return p;
  };
  const routes = new Map();
  for (const t of trips) {
    const a = get(t.source);
    const b = get(t.destination);
    if (b) {
      b.visits += 1;
      b.hours += t.mins / 60;
    }
    if (a && b) {
      const k = `${t.source}>${t.destination}`;
      const r = routes.get(k) || { a, b, mode: t.mode, count: 0 };
      r.count += 1;
      routes.set(k, r);
    }
  }
  for (const s of stays) {
    const p = get(s.city);
    if (!p) continue;
    if (s.type === "Home") p.home = true;
    else p.nights += 1;
  }
  return { places: [...places.values()], routes: [...routes.values()], unmapped: [...unmapped] };
}

const size = (p) => 3.6 + Math.min(p.visits + p.nights / 3, 9) * 0.8;

function Card({ title, sub, children }) {
  return (
    <section className="rise rounded-3xl border border-line bg-deck p-4">
      <h3 className="display text-base font-bold">{title}</h3>
      {sub && <p className="mb-3 text-xs text-mist">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Info({ p }) {
  if (!p) return <p className="mt-3 text-center text-xs text-mist">Tap a dot to see the city name</p>;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-night/60 px-4 py-3">
      <div className="min-w-0">
        <p className="display truncate text-lg font-bold" style={{ color: p.home && !p.visits && !p.nights ? HOME : GOLD }}>
          {p.name}
        </p>
        <p className="text-xs text-mist">{p.abroad ? "Outside India" : "India"}</p>
      </div>
      <p className="mono shrink-0 text-right text-xs text-mist">
        {p.visits} {p.visits === 1 ? "arrival" : "arrivals"}
        <br />
        {p.nights} {p.nights === 1 ? "night away" : "nights away"}
        {p.home && (
          <>
            <br />
            <span style={{ color: HOME }}>home</span>
          </>
        )}
        {p.hours > 0 && (
          <>
            <br />
            {fmtDuration(Math.round(p.hours * 60))} in
          </>
        )}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-mist">
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} /> visited
      </span>
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: HOME }} /> home
      </span>
      {Object.entries(MODE_COLORS).map(([m, c]) => (
        <span key={m} className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-4 rounded" style={{ background: c }} /> {m}
        </span>
      ))}
    </div>
  );
}

// ---------- India (main map) ----------
function IndiaMap({ places, routes, abroadCount }) {
  const [sel, setSel] = useState(null);
  const here = places.filter((p) => !p.abroad);
  const top = [...here].sort((a, b) => b.visits + b.nights - (a.visits + a.nights)).slice(0, 6);
  const selected = here.find((p) => p.name === sel) || null;
  const pos = (p) => project(p.lat, p.lon);

  return (
    <Card title="India map" sub={`${here.length} ${here.length === 1 ? "place" : "places"} visited · tap a dot for its name`}>
      <div className="mx-auto max-w-sm">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full" role="img" aria-label="Map of India with visited places" onClick={() => setSel(null)}>
          <defs>
            <linearGradient id="inLand" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1b3a6e" />
              <stop offset="1" stopColor="#14284f" />
            </linearGradient>
          </defs>
          <path d={INDIA_PATH} fill="url(#inLand)" stroke="#3f68b5" strokeWidth="1.4" strokeLinejoin="round" />

          {routes
            .filter((r) => !r.a.abroad && !r.b.abroad)
            .map((r) => {
              const [x1, y1] = pos(r.a);
              const [x2, y2] = pos(r.b);
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18;
              return <path key={`${r.a.name}>${r.b.name}`} d={`M${x1},${y1}Q${mx},${my} ${x2},${y2}`} fill="none" stroke={MODE_COLORS[r.mode] || "#38bdf8"} strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />;
            })}

          {here.map((p) => {
            const [x, y] = pos(p);
            const r = size(p);
            const on = sel === p.name;
            return (
              <g
                key={p.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setSel(p.name);
                }}
                style={{ cursor: "pointer" }}
              >
                <circle cx={x} cy={y} r="16" fill="transparent" />
                <circle cx={x} cy={y} r={r + 4} fill={GOLD} opacity={on ? 0.35 : 0.16} />
                <circle cx={x} cy={y} r={r} fill={GOLD} stroke={p.home ? HOME : "#0a1224"} strokeWidth={p.home ? 2 : 1.2} />
                {on && <circle cx={x} cy={y} r={r + 7} fill="none" stroke="#fff" strokeWidth="1.5" />}
              </g>
            );
          })}

          {top.map((p) => {
            const [x, y] = pos(p);
            return (
              <text key={`l-${p.name}`} x={x + size(p) + 4} y={y + 3} fontSize="10" fill="#e8eefc" stroke="#0a1224" strokeWidth="3" paintOrder="stroke" pointerEvents="none">
                {p.name}
              </text>
            );
          })}

          {selected && (() => {
            const [x, y] = pos(selected);
            const w = selected.name.length * 6.8 + 16;
            const bx = Math.min(Math.max(x - w / 2, 2), MAP_W - w - 2);
            return (
              <g pointerEvents="none">
                <rect x={bx} y={y - 36} width={w} height="22" rx="8" fill="#fff" />
                <text x={bx + w / 2} y={y - 21} fontSize="12" fontWeight="700" textAnchor="middle" fill="#0a1224">
                  {selected.name}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
      <Info p={selected} />
      <Legend />
      {abroadCount > 0 && <p className="mt-2 text-center text-xs text-sky">+ {abroadCount} {abroadCount === 1 ? "place" : "places"} outside India: see the globe below</p>}
    </Card>
  );
}

// ---------- Globe (only when there are places outside India) ----------
function Globe({ places, routes }) {
  const [rot, setRot] = useState(INDIA_VIEW);
  const [sel, setSel] = useState(null);
  const drag = useRef(null);
  const dots = useRef([]);
  const svgRef = useRef(null);

  const g = useMemo(() => {
    const proj = geoOrthographic().scale(R).translate([GLOBE / 2, GLOBE / 2]).clipAngle(90).precision(0.6).rotate(rot);
    const path = geoPath(proj);
    const center = [-rot[0], -rot[1]];
    return {
      land: path(WORLD_GEO),
      india: path(INDIA_GEO),
      grat: path(GRAT),
      routes: routes.map((r) => ({
        k: `${r.a.name}>${r.b.name}`,
        d: path({ type: "LineString", coordinates: [[r.a.lon, r.a.lat], [r.b.lon, r.b.lat]] }),
        c: MODE_COLORS[r.mode] || "#38bdf8",
      })),
      dots: places
        .filter((p) => geoDistance(center, [p.lon, p.lat]) < Math.PI / 2 - 0.03)
        .map((p) => {
          const [x, y] = proj([p.lon, p.lat]);
          return { p, x, y };
        }),
    };
  }, [rot, places, routes]);
  dots.current = g.dots;

  const toBox = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * GLOBE, ((e.clientY - r.top) / r.height) * GLOBE];
  };

  const down = (e) => {
    svgRef.current.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rot, moved: false };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 4) d.moved = true;
    if (d.moved) setRot([d.rot[0] + dx * 0.4, Math.max(-85, Math.min(85, d.rot[1] - dy * 0.4))]);
  };
  const up = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    // a tap: pick the nearest visible dot
    const [px, py] = toBox(e);
    let best = null;
    let bestD = 18;
    for (const { p, x, y } of dots.current) {
      const dist = Math.hypot(x - px, y - py);
      if (dist < bestD) {
        best = p;
        bestD = dist;
      }
    }
    setSel(best ? best.name : null);
  };

  const selected = places.find((p) => p.name === sel) || null;
  const selDot = g.dots.find((d) => d.p.name === sel);

  return (
    <Card title="Around the world" sub="Drag to spin the Earth · tap a dot for the city name">
      <div className="mx-auto max-w-xs">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${GLOBE} ${GLOBE}`}
          className="block w-full select-none"
          style={{ touchAction: "none", cursor: "grab" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => (drag.current = null)}
          role="img"
          aria-label="Rotating globe with visited places"
        >
          <defs>
            <radialGradient id="ocean" cx="38%" cy="32%" r="80%">
              <stop offset="0" stopColor="#1d4a8f" />
              <stop offset="0.6" stopColor="#102a57" />
              <stop offset="1" stopColor="#0a1632" />
            </radialGradient>
          </defs>
          <circle cx={GLOBE / 2} cy={GLOBE / 2} r={R + 6} fill="#38bdf8" opacity="0.12" />
          <circle cx={GLOBE / 2} cy={GLOBE / 2} r={R} fill="url(#ocean)" />
          <path d={g.grat} fill="none" stroke="#6aa6ff" strokeWidth="0.4" opacity="0.18" />
          <path d={g.land} fill="#2c4f86" stroke="#4a76b8" strokeWidth="0.5" />
          <path d={g.india} fill={GOLD} fillOpacity="0.85" stroke="#fff" strokeWidth="0.6" />
          {g.routes.map((r) => (
            <path key={r.k} d={r.d} fill="none" stroke={r.c} strokeWidth="1.3" opacity="0.8" strokeLinecap="round" />
          ))}
          {g.dots.map(({ p, x, y }) => (
            <g key={p.name}>
              <circle cx={x} cy={y} r={size(p) + 3} fill="#fff" opacity="0.18" />
              <circle cx={x} cy={y} r={Math.max(3, size(p) - 1)} fill={p.abroad ? "#ff7a59" : GOLD} stroke="#0a1224" strokeWidth="1" />
            </g>
          ))}
          {selDot && (() => {
            const w = selDot.p.name.length * 6.8 + 16;
            const bx = Math.min(Math.max(selDot.x - w / 2, 2), GLOBE - w - 2);
            return (
              <g pointerEvents="none">
                <circle cx={selDot.x} cy={selDot.y} r={size(selDot.p) + 6} fill="none" stroke="#fff" strokeWidth="1.5" />
                <rect x={bx} y={selDot.y - 38} width={w} height="22" rx="8" fill="#fff" />
                <text x={bx + w / 2} y={selDot.y - 23} fontSize="12" fontWeight="700" textAnchor="middle" fill="#0a1224">
                  {selDot.p.name}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => setRot(INDIA_VIEW)} className="rounded-full border border-line px-4 py-1.5 text-xs text-sky">
          Centre on India
        </button>
      </div>
      <Info p={selected} />
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-mist">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#ff7a59" }} /> abroad
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} /> India
        </span>
      </div>
    </Card>
  );
}

export default function TravelMap({ trips, stays }) {
  const { places, routes, unmapped } = useMemo(() => collect(trips, stays), [trips, stays]);
  const abroad = places.filter((p) => p.abroad);
  return (
    <>
      <IndiaMap places={places} routes={routes} abroadCount={abroad.length} />
      <Globe places={places} routes={routes} />
      {unmapped.length > 0 && <p className="px-1 text-center text-xs text-mist">Not on the map (position unknown): {unmapped.join(", ")}</p>}
    </>
  );
}
