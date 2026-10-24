import { useCallback, useEffect, useRef, useState } from "react";
import TravelForm from "./components/TravelForm.jsx";
import StayForm from "./components/StayForm.jsx";
import Insights from "./components/Insights.jsx";
import { BedIcon, ChartIcon, CloudShape, Logo, RefreshIcon, TicketIcon } from "./components/Icons.jsx";
import { useData } from "./hooks/useData.js";

const TABS = [
  { id: "travel", label: "Travelling", Icon: TicketIcon, title: "Where to next?", sub: "Log a journey" },
  { id: "stay", label: "Stay", Icon: BedIcon, title: "Where did you sleep?", sub: "Log a night" },
  { id: "insights", label: "Journey Insights", Icon: ChartIcon, title: "Your travel story", sub: "Hours, cities & trends" },
];

export default function App() {
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem("wayfarer_tab") || "travel";
    } catch {
      return "travel";
    }
  });
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const { travel, stay, loading, error, pending, refresh } = useData();

  const notify = useCallback((msg, type = "ok") => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wayfarer_tab", tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  const cur = TABS.find((t) => t.id === tab);

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      {/* sky header */}
      <header className="sky safe-top px-5 pb-6">
        <CloudShape className="c1" />
        <CloudShape className="c2" />
        <CloudShape className="c3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="display text-lg font-bold tracking-wide text-white">Wayfarer</span>
            <div className="ml-auto flex items-center gap-2">
              {pending > 0 && <span className="mono rounded-full bg-white/25 px-2.5 py-1 text-xs text-white">{pending} syncing</span>}
              <button onClick={() => refresh(true)} aria-label="Refresh" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white active:rotate-180">
                <RefreshIcon width={18} height={18} />
              </button>
            </div>
          </div>
          <h1 className="display mt-5 text-[28px] font-bold leading-tight text-white">{cur.title}</h1>
          <p className="text-sm text-white/80">{cur.sub}</p>
        </div>
      </header>

      {error && <p className="mx-4 mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

      <main className="px-4 pt-5">
        {tab === "travel" && <TravelForm trips={travel} notify={notify} />}
        {tab === "stay" && <StayForm stays={stay} notify={notify} />}
        {tab === "insights" && <Insights travel={travel} stay={stay} loading={loading} />}
      </main>

      {toast && (
        <div className="toast-in pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-2xl px-4 py-3 text-sm font-medium shadow-xl" style={{ background: toast.type === "ok" ? "#34d399" : "#fb7185", color: "#06210f" }}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* bottom tab bar */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night/90 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 px-2 pt-2">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-1 py-1.5" style={{ color: on ? "#38bdf8" : "#8fa0c4" }}>
                <span className="flex h-8 w-14 items-center justify-center rounded-full transition" style={{ background: on ? "rgba(56,189,248,.16)" : "transparent" }}>
                  <t.Icon width={22} height={22} />
                </span>
                <span className="text-[11px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
