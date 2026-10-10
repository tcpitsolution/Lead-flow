import { useEffect, useRef } from "react";

/**
 * AppToast – premium animated popup for errors, success, info, warning.
 *
 * Props:
 *   message  – string to show (falsy = hidden)
 *   type     – "error" | "success" | "info" | "warning"  (default "info")
 *   onClose  – called when user dismisses or auto-close fires
 *   duration – ms before auto-close (0 = no auto-close, default 4500)
 */
export default function AppToast({ message, type = "info", onClose, duration = 4500 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message) return;
    if (duration > 0) {
      timerRef.current = setTimeout(onClose, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [message, duration, onClose]);

  if (!message) return null;

  const cfg = {
    error:   { icon: "❌", accent: "#ff6b6b", bg: "rgba(224,49,49,0.13)",   border: "rgba(224,49,49,0.35)" },
    success: { icon: "✅", accent: "#51cf66", bg: "rgba(47,158,68,0.13)",   border: "rgba(47,158,68,0.35)" },
    warning: { icon: "⚠️", accent: "#ffd43b", bg: "rgba(230,180,0,0.13)",   border: "rgba(230,180,0,0.35)" },
    info:    { icon: "ℹ️", accent: "#74c0fc", bg: "rgba(77,171,247,0.13)",  border: "rgba(77,171,247,0.35)" },
  }[type] ?? cfg?.info;

  return (
    <>
      {/* backdrop blur overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation: "toast-fade-in 0.2s ease",
        }}
      />

      {/* popup card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          minWidth: 320,
          maxWidth: 480,
          width: "90vw",
          background: "linear-gradient(145deg, #1a1d2e, #12141f)",
          border: `1px solid ${cfg.border}`,
          borderRadius: 18,
          padding: "28px 28px 22px",
          boxShadow: `0 0 0 1px ${cfg.border}, 0 24px 60px rgba(0,0,0,0.6), 0 0 40px ${cfg.bg}`,
          animation: "toast-pop-in 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* icon + title row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{cfg.icon}</span>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: cfg.accent, marginBottom: 6 }}>
              {type === "error" ? "Something went wrong" :
               type === "success" ? "Done!" :
               type === "warning" ? "Heads up" : "Notice"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sub, #b0b8d1)", lineHeight: 1.6 }}>
              {message}
            </div>
          </div>

          {/* close × */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "var(--text-muted, #6b7280)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "4px 8px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* progress bar */}
        {duration > 0 && (
          <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: cfg.accent,
                animation: `toast-progress ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* dismiss button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            alignSelf: "flex-end",
            padding: "8px 22px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            border: `1px solid ${cfg.border}`,
            background: cfg.bg,
            color: cfg.accent,
          }}
        >
          Got it
        </button>
      </div>

      <style>{`
        @keyframes toast-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes toast-pop-in   { from { opacity:0; transform:translate(-50%,-50%) scale(0.88) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes toast-progress { from { width:100% } to { width:0% } }
      `}</style>
    </>
  );
}
