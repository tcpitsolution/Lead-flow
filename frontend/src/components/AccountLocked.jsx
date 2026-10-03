import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// ye dono apne asli contact se badal do
const CONTACT_EMAIL = "support@yourdomain.com";
const CONTACT_PHONE = "+91 00000 00000";

export default function AccountLocked({ access }) {
  const { logout, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const blocked = access.status === "blocked";

  const recheck = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0f2e",
        color: "#e8eaff",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          textAlign: "center",
          background: "#111741",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 8 }}>
          {blocked ? "🚫" : "⏰"}
        </div>
        <h1 style={{ fontSize: 24, margin: "0 0 10px" }}>
          {blocked ? "Account block hai" : "Free trial khatam ho gaya"}
        </h1>
        <p style={{ color: "#9aa0c8", lineHeight: 1.6, margin: "0 0 18px" }}>
          {blocked
            ? access.reason || "Aapka account admin ne roka hai."
            : "Aapke 14 din ka free trial poora ho gaya hai. Dobara use karne ke liye recharge karwao."}
        </p>
        <p style={{ fontSize: 14, margin: "0 0 22px" }}>
          Sampark:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#4dabf7" }}>
            {CONTACT_EMAIL}
          </a>
          <br />
          {CONTACT_PHONE}
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={recheck}
            disabled={checking}
            style={{
              background: "linear-gradient(135deg,#4da3ff,#7b8cff)",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "11px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {checking
              ? "Check ho raha hai..."
              : "Recharge ho gaya? Dobara check karo"}
          </button>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              color: "#9aa0c8",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "11px 20px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
