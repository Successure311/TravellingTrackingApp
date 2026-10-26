import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

// The app's own "are you sure?" box (instead of the browser popup that shows the site address).
//   const [confirm, confirmUI] = useConfirm();
//   if (!(await confirm("Delete the stay on 27 Oct (Surat)?"))) return;
//   ...and render {confirmUI} once in the component.
export function useConfirm() {
  const [req, setReq] = useState(null);

  const ask = useCallback(
    (message, { confirmLabel = "Delete", danger = true } = {}) => new Promise((resolve) => setReq({ message, confirmLabel, danger, resolve })),
    []
  );

  const answer = (value) => {
    req.resolve(value);
    setReq(null);
  };

  const ui =
    req &&
    createPortal(
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-6" onClick={() => answer(false)}>
        <div onClick={(e) => e.stopPropagation()} role="alertdialog" className="toast-in w-full max-w-xs rounded-3xl border border-line bg-night p-5">
          <p className="display whitespace-pre-line text-lg font-bold leading-snug">{req.message}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => answer(false)} className="h-12 rounded-2xl border border-line text-base font-semibold text-mist active:scale-95">
              Cancel
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => answer(true)}
              className="display h-12 rounded-2xl text-base font-bold active:scale-95"
              style={req.danger ? { background: "rgba(251,113,133,.16)", color: "#fda4af", border: "1px solid rgba(251,113,133,.5)" } : { background: "linear-gradient(90deg,#ff7a59,#ffc46b)", color: "#0a1224" }}
            >
              {req.confirmLabel}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return [ask, ui];
}
