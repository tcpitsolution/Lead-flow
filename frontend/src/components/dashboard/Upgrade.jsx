import { useEffect, useState } from "react";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const PLAN_COLORS = {
  "1m": "#4dabf7",
  "3m": "#51cf66",
  "6m": "#ffa94d",
  "1y": "#b197fc",
};

const SUPPORT_EMAIL = "leadflowcrm.support@gmail.com";

export default function Upgrade() {
  const [info, setInfo] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("plans"); // plans | pay | done
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadMy = async () => {
    try {
      const d = await api("/payments/my");
      setMyRequests(d.requests || []);
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => {
    api("/payments/info").then((d) => setInfo(d));
    loadMy();
  }, []);

  const payNow = async () => {
    setError("");

    if (!window.Razorpay) {
      return setError(
        "Payment system failed to load. Please refresh the page and try again.",
      );
    }

    setBusy(true);
    try {
      // 1) Create order (price is decided by the backend)
      const order = await api("/payments/create-order", {
        method: "POST",
        body: { plan: selected },
      });

      // 2) Open Razorpay popup
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Leadflowcrm",
        description: `${order.planLabel} Plan`,
        order_id: order.orderId,
        theme: { color: "#4f46e5" },

        // 3) Verify after payment
        handler: async (response) => {
          try {
            await api("/payments/verify", {
              method: "POST",
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            setStep("done");
            loadMy();
          } catch (err) {
            setError(
              `Your payment went through but could not be verified. Please don't worry, email ${SUPPORT_EMAIL} with Payment ID ${response.razorpay_payment_id} and we will fix it.`,
            );
          } finally {
            setBusy(false);
          }
        },

        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => {
        setBusy(false);
        setError(r?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      setBusy(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  const planEntries = info ? Object.entries(info.plans) : [];

  const statusColor = {
    paid: "#51cf66",
    failed: "#ff6b6b",
    pending: "#ffa94d",
    approved: "#51cf66",
    rejected: "#ff6b6b",
  };
  const statusLabel = {
    paid: "✅ Paid",
    failed: "❌ Failed",
    pending: "⏳ Pending",
    approved: "✅ Approved",
    rejected: "❌ Rejected",
  };

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Upgrade Plan</h1>
              <p className="nx-page-sub">
                Secure payment via Razorpay. Your plan is activated instantly.
              </p>
            </div>
          </div>

          {step === "plans" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                  gap: 14,
                  marginBottom: 32,
                }}
              >
                {planEntries.map(([key, plan]) => {
                  const color = PLAN_COLORS[key] || "#4dabf7";
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setSelected(key);
                        setStep("pay");
                        setError("");
                      }}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `2px solid ${color}44`,
                        borderRadius: 14,
                        padding: "20px 18px",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = color)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = `${color}44`)
                      }
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--text-muted)",
                          marginBottom: 6,
                        }}
                      >
                        {plan.label}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color }}>
                        ₹{plan.amount}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 4,
                        }}
                      >
                        {plan.days} days access
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          padding: "7px 0",
                          borderRadius: 8,
                          textAlign: "center",
                          background: `${color}22`,
                          color,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Select →
                      </div>
                    </div>
                  );
                })}
              </div>

              {myRequests.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>
                    My Payments
                  </div>
                  {myRequests.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>₹{r.amount}</span>
                        <span
                          style={{ color: "var(--text-muted)", marginLeft: 8 }}
                        >
                          {r.days} days
                          {r.razorpayPaymentId
                            ? ` · ID: ${r.razorpayPaymentId}`
                            : r.utrNumber
                              ? ` · UTR: ${r.utrNumber}`
                              : ""}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            color: statusColor[r.status],
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {statusLabel[r.status] || r.status}
                        </span>
                        <span
                          style={{ color: "var(--text-muted)", fontSize: 11 }}
                        >
                          {fmtDate(r.createdAt)}
                        </span>
                        {r.status === "rejected" && r.rejectedReason && (
                          <span style={{ color: "#ff6b6b", fontSize: 11 }}>
                            Reason: {r.rejectedReason}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === "pay" && info && info.plans[selected] && (
            <div style={{ maxWidth: 480 }}>
              <button
                onClick={() => {
                  setStep("plans");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                ← Back to plans
              </button>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: 24,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Selected Plan
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: PLAN_COLORS[selected],
                  }}
                >
                  {info.plans[selected].label} — ₹{info.plans[selected].amount}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {info.plans[selected].days} days access
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                Clicking Pay Now opens a secure Razorpay popup. You can pay
                using UPI, Card or Net Banking. Your plan is activated right
                after a successful payment.
              </div>

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 10 }}>
                  {error}
                </p>
              )}

              <button
                className="nx-add-btn"
                onClick={payNow}
                disabled={busy}
                style={{ width: "100%" }}
              >
                {busy
                  ? "Please wait..."
                  : `Pay Now — ₹${info.plans[selected].amount}`}
              </button>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                By paying, you agree to our{" "}
                <a href="/terms" target="_blank" rel="noreferrer">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/refund" target="_blank" rel="noreferrer">
                  Refund Policy
                </a>
                .
              </div>
            </div>
          )}

          {step === "done" && (
            <div
              style={{ maxWidth: 440, textAlign: "center", padding: "40px 0" }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ margin: "0 0 8px" }}>Payment Successful!</h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Your plan is now active. If you face any issue, email{" "}
                {SUPPORT_EMAIL}.
              </p>
              <button
                className="nx-add-btn"
                onClick={() => window.location.reload()}
              >
                Continue
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
