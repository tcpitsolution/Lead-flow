import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import "./Dashboard.css";

const STATUS = {
  trial: ["Free trial", "#4dabf7"],
  paid: ["Paid", "#51cf66"],
  expired: ["Trial expired", "#ffa94d"],
  blocked: ["Blocked", "#ff6b6b"],
  unverified: ["Email unverified", "#868e96"],
  admin: ["Admin", "#b197fc"],
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
const ago = (d) => {
  if (!d) return "Never";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
};

const th = {
  textAlign: "left",
  fontSize: 12,
  color: "var(--text-muted)",
  fontWeight: 500,
  padding: "12px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};
const td = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  fontSize: 13,
  verticalAlign: "top",
};
const small = { fontSize: 11, color: "var(--text-muted)", marginTop: 2 };
const smallBtn = (color) => ({
  background: "transparent",
  border: `1px solid ${color}66`,
  color,
  borderRadius: 8,
  padding: "5px 10px",
  fontSize: 12,
  cursor: "pointer",
});
const field = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  fontSize: 14,
  background: "var(--bg-input)",
  border: "1px solid var(--border3)",
  color: "var(--text)",
  colorScheme: "dark",
  fontFamily: "inherit",
  outline: "none",
};
const banner = (kind) => ({
  background: kind === "err" ? "rgba(224,49,49,0.1)" : "rgba(47,158,68,0.12)",
  border: `1px solid ${kind === "err" ? "rgba(224,49,49,0.2)" : "rgba(47,158,68,0.3)"}`,
  borderRadius: 10,
  padding: "12px 16px",
  marginBottom: 16,
  fontSize: 13,
  color: kind === "err" ? "#ff6b6b" : "#51cf66",
});

function Badge({ status }) {
  const [label, color] = STATUS[status] || [status, "#868e96"];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: `${color}26`,
      }}
    >
      {label}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 2px" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

function SignupChart({ data }) {
  const max = Math.max(...data.map((d) => d.n), 1);
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}
    >
      {data.map((d) => (
        <div
          key={d.day}
          title={`${d.day}: ${d.n} signup`}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div
            style={{ fontSize: 10, color: "var(--text-sub)", marginBottom: 2 }}
          >
            {d.n || ""}
          </div>
          <div
            style={{
              width: "100%",
              height: Math.max((d.n / max) * 70, d.n ? 4 : 2),
              borderRadius: 4,
              background: d.n
                ? "linear-gradient(180deg,#4da3ff,#7b8cff)"
                : "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}
          >
            {d.day.slice(8)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionModal({ modal, onClose, onDone }) {
  const { kind, user } = modal;
  const [days, setDays] = useState(kind === "trial" ? "7" : "30");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const TITLE = {
    recharge: `Recharge: ${user.name}`,
    trial: `Extend Trial: ${user.name}`,
    block: `Block User: ${user.name}`,
    unblock: `Unblock User: ${user.name}`,
    delete: `Delete User: ${user.name}`,
  };
  const quick = kind === "trial" ? [3, 7, 14] : [30, 90, 180, 365];

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      let data;
      if (kind === "recharge") {
        data = await api(`/admin/users/${user.id}/recharge`, {
          method: "POST",
          body: { days: Number(days), amount: amount === "" ? 0 : Number(amount), note },
        });
      } else if (kind === "trial") {
        data = await api(`/admin/users/${user.id}/extend-trial`, {
          method: "POST",
          body: { days: Number(days) },
        });
      } else if (kind === "delete") {
        data = await api(`/admin/users/${user.id}`, { method: "DELETE" });
      } else {
        data = await api(`/admin/users/${user.id}/block`, {
          method: "PATCH",
          body: { blocked: kind === "block", reason },
        });
      }
      onDone(data.message);
    } catch (e2) {
      console.error("Action error:", e2);
      setErr(e2.message || "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3,5,20,0.7)",
        display: "grid",
        placeItems: "center",
        zIndex: 300,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card, #0f1542)",
          border: "1px solid var(--border3)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 440,
          padding: 24,
          color: "var(--text)",
        }}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>{TITLE[kind]}</h2>
        <div style={{ ...small, marginBottom: 16 }}>{user.email}</div>

        {(kind === "recharge" || kind === "trial") && (
          <>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Number of Days
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDays(String(q))}
                  style={{
                    ...smallBtn(String(q) === days ? "#4da3ff" : "#868e96"),
                    background:
                      String(q) === days
                        ? "rgba(77,163,255,0.15)"
                        : "transparent",
                  }}
                >
                  {q} days
                </button>
              ))}
            </div>
            <input
              style={field}
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
          </>
        )}

        {kind === "recharge" && (
          <>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                margin: "14px 0 6px",
              }}
            >
              Amount Received (₹, optional)
            </div>
            <input
              style={field}
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 999"
            />
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                margin: "14px 0 6px",
              }}
            >
              Note (optional)
            </div>
            <input
              style={field}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="UPI, reference number..."
              maxLength={200}
            />
          </>
        )}

        {kind === "block" && (
          <>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Reason (will be shown to user)
            </div>
            <input
              style={field}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Payment pending"
              maxLength={200}
            />
          </>
        )}

        {kind === "unblock" && (
          <p style={{ color: "var(--text-sub)", fontSize: 14, margin: 0 }}>
            The account will be reactivated. If the trial has ended and no recharge has been done, it will remain "Trial expired".
          </p>
        )}

        {kind === "delete" && (
          <p style={{ color: "#ff6b6b", fontSize: 14, margin: 0 }}>
            ⚠️ This action is permanent. {user.name}'s account, all leads and data will be deleted forever.
          </p>
        )}

        {err && (
          <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 12 }}>{err}</p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button type="button" onClick={onClose} style={smallBtn("#868e96")}>
            Cancel
          </button>
          <button className="nx-add-btn" type="button" disabled={busy} onClick={submit}>
            {busy ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpiSettings() {
  const [upiId, setUpiId] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/admin/settings/upi").then((d) => { setUpiId(d.upiId); setInput(d.upiId); });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const d = await api("/admin/settings/upi", { method: "PUT", body: { upiId: input } });
      setUpiId(d.upiId);
      setMsg("✅ UPI ID updated successfully");
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>UPI Settings</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Current: <strong style={{ color: "#e8eaff" }}>{upiId}</strong></div>
      <form onSubmit={save} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          style={{ ...field, flex: 1, minWidth: 240 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter new UPI ID"
        />
        <button className="nx-add-btn" type="submit" disabled={busy}>{busy ? "Save..." : "Save"}</button>
      </form>
      {msg && <div style={{ fontSize: 13, marginTop: 10, color: msg.startsWith("✅") ? "#51cf66" : "#ff6b6b" }}>{msg}</div>}
    </div>
  );
}

function PaymentRequests({ onApprove }) {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = (status) => {
    api(`/admin/payment-requests?status=${status}`).then((d) => setRequests(d.requests || []));
  };

  useEffect(() => { load(tab); }, [tab]);

  const approve = async (id) => {
    setBusy(id);
    try {
      const d = await api(`/admin/payment-requests/${id}/approve`, { method: "PATCH" });
      onApprove(d.message);
      load(tab);
    } catch (err) { alert(err.message); }
    finally { setBusy(null); }
  };

  const reject = async () => {
    setBusy(rejectModal);
    try {
      await api(`/admin/payment-requests/${rejectModal}/reject`, { method: "PATCH", body: { reason: rejectReason } });
      setRejectModal(null); setRejectReason("");
      load(tab);
    } catch (err) { alert(err.message); }
    finally { setBusy(null); }
  };

  const statusColor = { pending: "#ffa94d", approved: "#51cf66", rejected: "#ff6b6b" };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 14 }}>Payment Requests</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setTab(s)} style={{ ...smallBtn(tab === s ? statusColor[s] : "#868e96"), background: tab === s ? `${statusColor[s]}22` : "transparent", textTransform: "capitalize" }}>{s}</button>
        ))}
      </div>
      {requests.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No {tab} requests found</div>}
      {requests.map((r) => (
        <div key={r._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{r.user?.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>— ₹{r.amount} ({r.days} days)</span></div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{r.user?.email} · {r.user?.phone}</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>UTR: <strong style={{ color: "#e8eaff" }}>{r.utrNumber}</strong> · UPI: {r.upiId}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(r.createdAt).toLocaleString("en-IN")}</div>
            {r.rejectedReason && <div style={{ fontSize: 12, color: "#ff6b6b", marginTop: 2 }}>Reason: {r.rejectedReason}</div>}
          </div>
          {tab === "pending" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button style={smallBtn("#51cf66")} disabled={busy === r._id} onClick={() => approve(r._id)}>{busy === r._id ? "..." : "✅ Approve"}</button>
              <button style={smallBtn("#ff6b6b")} onClick={() => { setRejectModal(r._id); setRejectReason(""); }}>❌ Reject</button>
            </div>
          )}
        </div>
      ))}
      {rejectModal && (
        <div onClick={() => setRejectModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(3,5,20,0.7)", display: "grid", placeItems: "center", zIndex: 300, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-card, #0f1542)", border: "1px solid var(--border3)", borderRadius: 16, width: "100%", maxWidth: 400, padding: 24, color: "var(--text)" }}>
            <h3 style={{ margin: "0 0 14px" }}>Reject Reason (optional)</h3>
            <input style={field} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. UTR could not be verified" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={smallBtn("#868e96")} onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="nx-add-btn" disabled={busy === rejectModal} onClick={reject}>{busy === rejectModal ? "..." : "Reject"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null); // { kind, user }

  const loadStats = useCallback(async () => {
    try {
      const d = await api("/admin/stats");
      setStats(d.stats);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 15, filter });
      if (search.trim()) q.set("search", search.trim());
      const d = await api(`/admin/users?${q}`);
      setUsers(d.users);
      setMeta({ total: d.total, pages: d.pages });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const done = (message) => {
    setModal(null);
    setNotice(message);
    loadStats();
    loadUsers();
  };

  const cards = stats
    ? [
        ["Total users", stats.users.total, `${stats.users.verified} verified`],
        ["Online Now", stats.online, "in last 10 minutes"],
        ["Active 24h", stats.active24h, `Last 7 days: ${stats.active7d}`],
        ["New Today", stats.newToday, `Last 7 days: ${stats.new7d}`],
        ["Free Trial", stats.users.trial, "currently active"],
        ["Trial Expired", stats.users.expired, "not recharged"],
        ["Paid", stats.users.paid, "active plan"],
        ["Blocked", stats.users.blocked, "blocked by admin"],
        ["Total Leads", stats.leads, `${stats.prospects} prospects`],
        [
          "Revenue",
          money(stats.revenue.total),
          `This month: ${money(stats.revenue.thisMonth)}`,
        ],
      ]
    : [];

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Admin Panel</h1>
              <p className="nx-page-sub">
                Manage users, trials and recharges from here
              </p>
            </div>
          </div>

          {error && <div style={banner("err")}>{error}</div>}
          {notice && <div style={banner("ok")}>{notice}</div>}

          <UpiSettings />
          <PaymentRequests onApprove={(msg) => { setNotice(msg); loadStats(); loadUsers(); }} />

          {/* STATS */}
          {stats && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {cards.map(([label, value, sub]) => (
                  <StatCard key={label} label={label} value={value} sub={sub} />
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>
                    Signups (last 14 days)
                  </div>
                  <SignupChart data={stats.signups} />
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>
                    Recent Recharges
                  </div>
                  {stats.recentPayments.length === 0 && (
                    <div style={small}>No recharges yet</div>
                  )}
                  {stats.recentPayments.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "6px 0",
                        fontSize: 13,
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <span>
                        {p.user?.name || "Deleted user"}
                        <span style={small}> · {p.days} days</span>
                      </span>
                      <span style={{ color: "#51cf66" }}>
                        {money(p.amount)}
                        <span style={small}> · {fmtDate(p.createdAt)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* USERS */}
          <div className="nx-section-title" style={{ marginBottom: 12 }}>
            Users ({meta.total})
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <input
              style={{ ...field, flex: 1, minWidth: 220 }}
              placeholder="Search by name, email or phone"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              style={{ ...field, width: 200 }}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All users</option>
              <option value="trial">Free trial</option>
              <option value="expired">Trial expired</option>
              <option value="paid">Paid</option>
              <option value="blocked">Blocked</option>
              <option value="unverified">Email unverified</option>
            </select>
          </div>

          <div
            style={{
              overflowX: "auto",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 860,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>User</th>
                  <th style={th}>Status</th>
                  <th style={th}>Joined</th>
                  <th style={th}>Last seen</th>
                  <th style={th}>Data</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        ...td,
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        ...td,
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No users found
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((u) => (
                    <tr key={u.id}>
                      <td style={td}>
                        <b>{u.name}</b>
                        <div style={small}>{u.email}</div>
                        <div style={small}>
                          {u.phone} ·{" "}
                          {u.userType === "company_owner"
                            ? u.companyName || "Company owner"
                            : "Freelancer"}
                        </div>
                      </td>
                      <td style={td}>
                        <Badge status={u.status} />
                        <div style={small}>
                          {(u.status === "trial" || u.status === "paid") &&
                            `${u.access.daysLeft} days left (until ${fmtDate(u.access.endsAt)})`}
                          {u.status === "expired" &&
                            `Expired on ${fmtDate(u.access.endsAt)}`}
                          {u.status === "blocked" &&
                            (u.access.reason || "No reason provided")}
                        </div>
                      </td>
                      <td style={td}>{fmtDate(u.createdAt)}</td>
                      <td style={td}>
                        {ago(u.lastSeenAt || u.lastLoginAt)}
                        <div style={small}>{u.loginCount} logins</div>
                      </td>
                      <td style={td}>
                        {u.leads} leads
                        <div style={small}>{u.prospects} prospects</div>
                      </td>
                      <td style={td}>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          <button
                            style={smallBtn("#51cf66")}
                            onClick={() =>
                              setModal({ kind: "recharge", user: u })
                            }
                          >
                            Recharge
                          </button>
                          {(u.status === "trial" || u.status === "expired") && (
                            <button
                              style={smallBtn("#4dabf7")}
                              onClick={() =>
                                setModal({ kind: "trial", user: u })
                              }
                            >
                              + Trial
                            </button>
                          )}
                          {u.isBlocked ? (
                            <button
                              style={smallBtn("#ffa94d")}
                              onClick={() =>
                                setModal({ kind: "unblock", user: u })
                              }
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              style={smallBtn("#ff6b6b")}
                              onClick={() =>
                                setModal({ kind: "block", user: u })
                              }
                            >
                              Block
                            </button>
                          )}
                          <button
                            style={smallBtn("#e03131")}
                            onClick={() =>
                              setModal({ kind: "delete", user: u })
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 14,
                marginTop: 16,
                color: "var(--text-sub)",
                fontSize: 13,
              }}
            >
              <button
                style={smallBtn("#868e96")}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} / {meta.pages}
              </span>
              <button
                style={smallBtn("#868e96")}
                disabled={page >= meta.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
