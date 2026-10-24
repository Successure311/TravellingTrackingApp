import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Block iOS pinch-zoom so the layout stays fixed.
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault())
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

createRoot(document.getElementById("root")).render(<App />);
