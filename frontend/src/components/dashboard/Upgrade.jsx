import { useEffect, useState } from "react";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const PLAN_COLORS = { "1m": "#4dabf7", "3m": "#51cf66", "6m": "#ffa94d", "1y": "#b197fc" };

export default function Upgrade() {
  const [info, setInfo] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("plans"); // plans | pay | done
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api("/payments/info").then((d) => { setInfo(d); });
    api("/payments/my").then((d) => setMyRequests(d.requests || []));
  }, []);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!utr.trim()) return setError("UTR / Transaction ID daalo");
    setBusy(true);
    setError("");
    try {
      await api("/payments/request", { method: "POST", body: { plan: selected, utrNumber: utr.trim() } });
      setStep("done");
      const d = await api("/payments/my");
      setMyRequests(d.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const planEntries = info ? Object.entries(info.plans) : [];

  const statusColor = { pending: "#ffa94d", approved: "#51cf66", rejected: "#ff6b6b" };
  const statusLabel = { pending: "⏳ Pending", approved: "✅ Approved", rejected: "❌ Rejected" };

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Upgrade Plan</h1>
              <p className="nx-page-sub">UPI se payment karo, UTR submit karo — admin verify karke activate kar dega</p>
            </div>
          </div>

          {step === "plans" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 32 }}>
                {planEntries.map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => { setSelected(key); setStep("pay"); setUtr(""); setError(""); }}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `2px solid ${PLAN_COLORS[key]}44`,
                      borderRadius: 14,
                      padding: "20px 18px",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = PLAN_COLORS[key]}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = `${PLAN_COLORS[key]}44`}
                  >
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{plan.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: PLAN_COLORS[key] }}>₹{plan.amount}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{plan.days} din access</div>
                    <div style={{
                      marginTop: 14, padding: "7px 0", borderRadius: 8, textAlign: "center",
                      background: `${PLAN_COLORS[key]}22`, color: PLAN_COLORS[key], fontSize: 13, fontWeight: 600
                    }}>
                      Select →
                    </div>
                  </div>
                ))}
              </div>

              {myRequests.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Meri Payment Requests</div>
                  {myRequests.map((r) => (
                    <div key={r._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>₹{r.amount}</span>
                        <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{r.days} din · UTR: {r.utrNumber}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <span style={{ color: statusColor[r.status], fontWeight: 600, fontSize: 12 }}>{statusLabel[r.status]}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{fmtDate(r.createdAt)}</span>
                        {r.status === "rejected" && r.rejectedReason && (
                          <span style={{ color: "#ff6b6b", fontSize: 11 }}>Reason: {r.rejectedReason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === "pay" && info && (
            <div style={{ maxWidth: 480 }}>
              <button onClick={() => setStep("plans")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginBottom: 16, fontSize: 13 }}>
                ← Wapas plans pe
              </button>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Selected Plan</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: PLAN_COLORS[selected] }}>
                  {info.plans[selected].label} — ₹{info.plans[selected].amount}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{info.plans[selected].days} din access</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 24, marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Is UPI ID pe payment karo</div>

                {/* QR Code — UPI deep link se generate */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${info.upiId}&pn=LeadFlow&am=${info.plans[selected].amount}&cu=INR&tn=LeadFlow+${info.plans[selected].label}`)}`}
                  alt="UPI QR Code"
                  style={{ borderRadius: 10, marginBottom: 14, border: "4px solid white" }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>{info.upiId}</span>
                  <button
                    onClick={() => copy(info.upiId)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, padding: "4px 10px", color: copied ? "#51cf66" : "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Amount: <strong style={{ color: "#e8eaff" }}>₹{info.plans[selected].amount}</strong>
                </div>
              </div>

              <form onSubmit={submitRequest}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                  Payment karne ke baad UTR / Transaction ID daalo
                </div>
                <input
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text, #e8eaff)", colorScheme: "dark", boxSizing: "border-box", marginBottom: 8 }}
                  placeholder="jaise: 425612345678"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  maxLength={50}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
                  UTR number UPI app mein payment history mein milega
                </div>
                {error && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 10 }}>{error}</p>}
                <button className="nx-add-btn" type="submit" disabled={busy} style={{ width: "100%" }}>
                  {busy ? "Submit ho raha hai..." : "Payment Submit Karo"}
                </button>
              </form>
            </div>
          )}

          {step === "done" && (
            <div style={{ maxWidth: 440, textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ margin: "0 0 8px" }}>Request Submit Ho Gayi!</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
                Admin verify karke jald hi aapka plan activate kar dega. Agar koi issue ho toh admin se contact karo.
              </p>
              <button className="nx-add-btn" onClick={() => { setStep("plans"); setSelected(null); setUtr(""); }}>
                Wapas Jao
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
