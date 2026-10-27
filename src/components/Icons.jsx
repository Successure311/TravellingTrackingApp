const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const PlaneIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M10.2 13.8 3 11.7l1.3-1.6 6.6.3 3.8-4.6c.6-.7 1.8-.9 2.3-.4.4.4.3 1.3-.3 2l-3.1 5.3 4.7 6.1-1.6 1.1-5.3-4.7-2 4-1.3-.4z" fill="currentColor" stroke="none" transform="rotate(45 12 12) translate(-1 1)" />
  </svg>
);
export const TrainIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="14" rx="3" />
    <path d="M5 11h14M9 21l2-4M15 21l-2-4" />
    <circle cx="9" cy="14" r=".6" fill="currentColor" />
    <circle cx="15" cy="14" r=".6" fill="currentColor" />
  </svg>
);
export const CarIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 16V11l2-5h10l2 5v5M3 16h18v2.5H3z" />
    <circle cx="7.5" cy="13" r=".7" fill="currentColor" />
    <circle cx="16.5" cy="13" r=".7" fill="currentColor" />
    <path d="M5 11h14" />
  </svg>
);
export const HomeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5V14h4v5.5" />
  </svg>
);
export const TentIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4 3 20h18L12 4zM12 4v16M12 20l-3.5-6M12 20l3.5-6" />
  </svg>
);
export const PinIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const SwapIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" />
  </svg>
);
export const TrashIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
export const ChartIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </svg>
);
export const TicketIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3z" />
    <path d="M14 6v12" strokeDasharray="2 2" />
  </svg>
);
export const BedIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
    <circle cx="7" cy="11" r="1.8" />
  </svg>
);
export const RefreshIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" />
  </svg>
);
export const ReturnIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />
  </svg>
);

export const CloudShape = ({ className }) => (
  <svg className={`cloud ${className}`} viewBox="0 0 64 32" aria-hidden="true">
    <path d="M16 30a10 10 0 0 1-1-19.9A14 14 0 0 1 42 8a11 11 0 0 1 4 21.6V30z" />
  </svg>
);

// Brand mark: plane over a sun, used in the header
export const Logo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff7a59" />
        <stop offset="1" stopColor="#ffc46b" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="#fff" fillOpacity=".18" />
    <circle cx="30" cy="30" r="9" fill="url(#lg)" />
    <path d="M8 24 38 11l-5 26-9-8-5 5-1-8z" fill="#fff" />
  </svg>
);

export const MODES = {
  Train: { label: "Train", color: "#fbbf24", Icon: TrainIcon },
  Flight: { label: "Flight", color: "#38bdf8", Icon: PlaneIcon },
  Car: { label: "Car", color: "#34d399", Icon: CarIcon },
};
