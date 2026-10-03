import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import "./Dashboard.css";

const STATUSES = ["new", "contacted", "interested", "won", "lost"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// status ko pipeline stage naam mein map karo
const STAGE_MAP = {
  new: "Prospecting",
  contacted: "Qualification",
  interested: "Proposal",
  won: "Closed Won",
  lost: "Closed Lost",
};

const STAGE_ORDER = ["new", "contacted", "interested", "won", "lost"];

const AVATAR_COLORS = [
  "#3b5bdb",
  "#7048e8",
  "#0ca678",
  "#e67700",
  "#c92a2a",
  "#1864ab",
];

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function fmt(num) {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [activeTab, setActiveTab] = useState("insights");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    value: "",
    status: "new",
    followUpDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ALL leads for stats/pipeline (no pagination, no filter)
  const [allLeads, setAllLeads] = useState([]);

  const loadAll = useCallback(async () => {
    try {
      const data = await api("/leads?limit=100");
      setAllLeads(data.items || []);
    } catch {
      setAllLeads([]);
    }
  }, []);

  const loadFiltered = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 10 });
      if (search.trim()) q.set("search", search.trim());
      if (statusFilter) q.set("status", statusFilter);
      const data = await api(`/leads?${q}`);
      setLeads(data.items || []);
      setMeta({ total: data.total, pages: data.pages });
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const t = setTimeout(loadFiltered, 300);
    return () => clearTimeout(t);
  }, [loadFiltered]);

  // --- COMPUTED STATS from allLeads ---
  const totalValue = allLeads.reduce((s, l) => s + (l.value || 0), 0);
  const wonLeads = allLeads.filter((l) => l.status === "won");
  const winRate = allLeads.length
    ? Math.round((wonLeads.length / allLeads.length) * 100)
    : 0;

  // avg deal cycle: days between createdAt and updatedAt for won leads
  const avgCycle = wonLeads.length
    ? Math.round(
        wonLeads.reduce((s, l) => {
          const diff = new Date(l.updatedAt) - new Date(l.createdAt);
          return s + diff / (1000 * 60 * 60 * 24);
        }, 0) / wonLeads.length,
      )
    : 0;

  // pipeline stages grouped
  const pipelineStages = STAGE_ORDER.slice(0, 3).map((st) => {
    const stLeads = allLeads.filter((l) => l.status === st);
    const stValue = stLeads.reduce((s, l) => s + (l.value || 0), 0);
    return { status: st, name: STAGE_MAP[st], value: stValue, leads: stLeads };
  });

  // monthly forecast: group leads by createdAt month, sum value
  const monthlyData = Array(12).fill(0);
  allLeads.forEach((l) => {
    const m = new Date(l.createdAt).getMonth();
    monthlyData[m] += l.value || 0;
  });
  const maxMonthVal = Math.max(...monthlyData, 1);

  // recent activity: last 5 leads sorted by updatedAt
  const recentActivity = [...allLeads]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const changeStatus = async (id, newStatus) => {
    const old = allLeads;
    setAllLeads(
      allLeads.map((l) => (l._id === id ? { ...l, status: newStatus } : l)),
    );
    try {
      await api(`/leads/${id}`, { method: "PUT", body: { status: newStatus } });
    } catch {
      setAllLeads(old);
    }
  };

  const addLead = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Name required");
    setSaving(true);
    setFormError("");
    try {
      const body = Object.fromEntries(
        Object.entries(form).filter(([, v]) => String(v).trim() !== ""),
      );
      if (body.value) body.value = Number(body.value);
      await api("/leads", { method: "POST", body });
      setForm({
        name: "",
        company: "",
        phone: "",
        email: "",
        value: "",
        status: "new",
        followUpDate: "",
      });
      setShowAddForm(false);
      loadAll();
      loadFiltered();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api(`/leads/${id}`, { method: "DELETE" });
      loadAll();
      loadFiltered();
    } catch {}
  };

  const hasData = allLeads.length > 0;

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />

        {/* PAGE CONTENT */}
        <main className="nx-main">
          {/* PAGE HEADER */}
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">
                Welcome, {user?.name?.split(" ")[0]}
              </h1>
              <p className="nx-page-sub">
                {hasData
                  ? `${allLeads.length} leads · ${fmt(totalValue)} pipeline value`
                  : "Add your first lead to get started"}
              </p>
            </div>
            <div className="nx-page-actions">
              <select
                className="nx-filter-btn"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_MAP[s] || s}
                  </option>
                ))}
              </select>
              <button
                className="nx-add-btn"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "✕ Cancel" : "+ Add Lead"}
              </button>
            </div>
          </div>

          {/* ADD LEAD FORM */}
          {showAddForm && (
            <form className="nx-add-form" onSubmit={addLead} noValidate>
              <div className="nx-form-grid">
                <div className="nx-field">
                  <label>Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Lead name"
                  />
                </div>
                <div className="nx-field">
                  <label>Company</label>
                  <input
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    placeholder="Company"
                  />
                </div>
                <div className="nx-field">
                  <label>Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Phone"
                  />
                </div>
                <div className="nx-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Email"
                  />
                </div>
                <div className="nx-field">
                  <label>Deal Value (₹)</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="nx-field">
                  <label>Stage</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_MAP[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="nx-field">
                  <label>Follow-up Date</label>
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) =>
                      setForm({ ...form, followUpDate: e.target.value })
                    }
                  />
                </div>
              </div>
              {formError && <p className="nx-form-err">{formError}</p>}
              <button className="nx-add-btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Lead"}
              </button>
            </form>
          )}

          {/* EMPTY STATE */}
          {!hasData && !loading && (
            <div className="nx-empty-state">
              <div className="nx-empty-icon">📋</div>
              <h2>No leads yet</h2>
              <p>
                Add your first lead to see your pipeline, stats, and revenue
                forecast here.
              </p>
              <button
                className="nx-add-btn"
                onClick={() => setShowAddForm(true)}
              >
                + Add First Lead
              </button>
            </div>
          )}

          {/* DASHBOARD DATA - only show when leads exist */}
          {hasData && (
            <div className="nx-content-grid">
              {/* LEFT COLUMN */}
              <div className="nx-left-col">
                {/* STATS ROW */}
                <div className="nx-stats-row">
                  <div className="nx-stat">
                    <span className="nx-stat-num">{allLeads.length}</span>
                    <span className="nx-stat-label">Active Leads</span>
                  </div>
                  <div className="nx-stat-divider" />
                  <div className="nx-stat">
                    <span className="nx-stat-num">{fmt(totalValue)}</span>
                    <span className="nx-stat-label">Pipeline Value</span>
                  </div>
                  <div className="nx-stat-divider" />
                  <div className="nx-stat">
                    <span className="nx-stat-num">{winRate}%</span>
                    <span className="nx-stat-label">Win Rate</span>
                  </div>
                  <div className="nx-stat-divider" />
                  <div className="nx-stat">
                    <span className="nx-stat-num">
                      {avgCycle > 0 ? avgCycle : "-"}{" "}
                      {avgCycle > 0 && (
                        <span className="nx-stat-unit">days</span>
                      )}
                    </span>
                    <span className="nx-stat-label">Avg Deal Cycle</span>
                  </div>
                </div>

                {/* PIPELINE KANBAN */}
                <div className="nx-kanban">
                  {pipelineStages.map((stage) => (
                    <div key={stage.status} className="nx-kanban-col">
                      <div className="nx-kanban-header">
                        <h3>{stage.name}</h3>
                        <span className="nx-kanban-val">
                          {fmt(stage.value)}
                        </span>
                      </div>
                      {stage.leads.length === 0 ? (
                        <div className="nx-kanban-empty">
                          No leads in this stage
                        </div>
                      ) : (
                        stage.leads.slice(0, 2).map((lead) => (
                          <div key={lead._id} className="nx-deal-card">
                            <div className="nx-deal-title">{lead.name}</div>
                            {lead.company && (
                              <div className="nx-deal-stage">
                                Company: <span>{lead.company}</span>
                              </div>
                            )}
                            {lead.value > 0 && (
                              <div className="nx-deal-amount">
                                {fmt(lead.value)}
                              </div>
                            )}
                            <div className="nx-deal-meta">
                              <div
                                className="nx-deal-avatar"
                                style={{
                                  background: getAvatarColor(lead.name),
                                }}
                              >
                                {lead.name[0].toUpperCase()}
                              </div>
                              <div className="nx-deal-info">
                                {lead.phone && (
                                  <div>
                                    Phone: <strong>{lead.phone}</strong>
                                  </div>
                                )}
                                {lead.email && (
                                  <div>
                                    Email: <strong>{lead.email}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                            {lead.followUpDate && (
                              <div className="nx-deal-due">
                                Follow-up:{" "}
                                <strong>
                                  {new Date(
                                    lead.followUpDate,
                                  ).toLocaleDateString("en-IN")}
                                </strong>
                              </div>
                            )}
                            <div className="nx-deal-actions">
                              <select
                                className={`nx-pill nx-pill-${lead.status}`}
                                value={lead.status}
                                onChange={(e) =>
                                  changeStatus(lead._id, e.target.value)
                                }
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {STAGE_MAP[s]}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="nx-del-btn"
                                onClick={() => deleteLead(lead._id, lead.name)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      {stage.leads.length > 2 && (
                        <div className="nx-kanban-more">
                          +{stage.leads.length - 2} more
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* REVENUE FORECAST */}
                <div className="nx-forecast-card">
                  <div className="nx-forecast-header">
                    <h3>Revenue Forecast</h3>
                    <div className="nx-forecast-legend">
                      <span className="nx-legend-dot blue" /> Pipeline value by
                      month
                    </div>
                  </div>
                  <div className="nx-chart-area">
                    <div className="nx-chart-y">
                      <span>{fmt(maxMonthVal)}</span>
                      <span>{fmt(maxMonthVal / 2)}</span>
                      <span>$0</span>
                    </div>
                    <div className="nx-chart-plot">
                      <svg
                        viewBox="0 0 700 160"
                        preserveAspectRatio="none"
                        className="nx-chart-svg"
                      >
                        <defs>
                          <linearGradient
                            id="lineGrad1"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#4dabf7" />
                            <stop offset="100%" stopColor="#748ffc" />
                          </linearGradient>
                          <linearGradient
                            id="areaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#4dabf7"
                              stopOpacity="0.15"
                            />
                            <stop
                              offset="100%"
                              stopColor="#4dabf7"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        {[40, 80, 120].map((y) => (
                          <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="700"
                            y2={y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                        ))}
                        {/* Area fill */}
                        <polygon
                          points={[
                            ...monthlyData.map((v, i) => {
                              const x = (i / 11) * 700;
                              const y = 140 - (v / maxMonthVal) * 120;
                              return `${x},${y}`;
                            }),
                            "700,140",
                            "0,140",
                          ].join(" ")}
                          fill="url(#areaGrad)"
                        />
                        {/* Line */}
                        <polyline
                          points={monthlyData
                            .map((v, i) => {
                              const x = (i / 11) * 700;
                              const y = 140 - (v / maxMonthVal) * 120;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="url(#lineGrad1)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Dots */}
                        {monthlyData.map((v, i) => {
                          if (v === 0) return null;
                          const x = (i / 11) * 700;
                          const y = 140 - (v / maxMonthVal) * 120;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#4dabf7"
                            />
                          );
                        })}
                      </svg>
                      <div className="nx-chart-labels">
                        {MONTHS.map((m) => (
                          <span key={m}>{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="nx-right-col">
                {/* PIPELINE SUMMARY */}
                <div className="nx-intel-card">
                  <div className="nx-intel-header">
                    <span className="nx-intel-icon">⟳</span>
                    <h3>Pipeline Summary</h3>
                  </div>
                  {STATUSES.map((st) => {
                    const count = allLeads.filter(
                      (l) => l.status === st,
                    ).length;
                    const val = allLeads
                      .filter((l) => l.status === st)
                      .reduce((s, l) => s + (l.value || 0), 0);
                    if (count === 0) return null;
                    return (
                      <div key={st} className="nx-intel-item">
                        <div className="nx-intel-row">
                          <span className={`nx-pill nx-pill-${st}`}>
                            {STAGE_MAP[st]}
                          </span>
                          <span className="nx-intel-count">{count} leads</span>
                        </div>
                        {val > 0 && (
                          <div className="nx-intel-val">{fmt(val)}</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="nx-intel-tabs">
                    <button
                      className={`nx-tab${activeTab === "insights" ? " active" : ""}`}
                      onClick={() => setActiveTab("insights")}
                    >
                      💡 Insights
                    </button>
                    <button
                      className={`nx-tab${activeTab === "activity" ? " active" : ""}`}
                      onClick={() => setActiveTab("activity")}
                    >
                      ⏱ Activity
                    </button>
                  </div>
                </div>

                {/* PERFORMANCE */}
                <div className="nx-perf-card">
                  <div className="nx-perf-header">
                    <h3>Performance</h3>
                  </div>
                  <div className="nx-gauge-wrap">
                    <svg viewBox="0 0 200 120" className="nx-gauge-svg">
                      <defs>
                        <linearGradient
                          id="gaugeGrad"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="#4dabf7" />
                          <stop offset="50%" stopColor="#748ffc" />
                          <stop offset="100%" stopColor="#cc5de8" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      {winRate > 0 && (
                        <path
                          d={`M 20 100 A 80 80 0 ${winRate > 50 ? 1 : 0} 1 ${20 + 160 * Math.sin((winRate / 100) * Math.PI)} ${100 - 80 * (1 - Math.cos((winRate / 100) * Math.PI))}`}
                          fill="none"
                          stroke="url(#gaugeGrad)"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    <div className="nx-gauge-center">
                      <span className="nx-gauge-num">{winRate}%</span>
                      <span className="nx-gauge-label">Win Rate</span>
                      <span className="nx-gauge-sub">
                        {wonLeads.length} won / {allLeads.length} total
                      </span>
                    </div>
                  </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="nx-timeline-card">
                  <div className="nx-timeline-title">Recent Activity</div>
                  {recentActivity.map((lead, i) => (
                    <div key={lead._id} className="nx-timeline-item">
                      <div
                        className={`nx-timeline-dot${i === 0 ? " check" : " blue"}`}
                      >
                        ✓
                      </div>
                      <div>
                        <div className="nx-timeline-date">{lead.name}</div>
                        <div className="nx-timeline-desc">
                          {STAGE_MAP[lead.status]} ·{" "}
                          {new Date(lead.updatedAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEARCH RESULTS TABLE */}
          {(search || statusFilter) && (
            <div className="nx-leads-section">
              <h3 className="nx-section-title">Search Results</h3>
              <div className="nx-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Phone</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Follow-up</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan="7" className="nx-empty">
                          Loading...
                        </td>
                      </tr>
                    )}
                    {!loading && leads.length === 0 && (
                      <tr>
                        <td colSpan="7" className="nx-empty">
                          No leads found
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      leads.map((l) => (
                        <tr key={l._id}>
                          <td>{l.name}</td>
                          <td>{l.company || "-"}</td>
                          <td>{l.phone || "-"}</td>
                          <td>{l.value > 0 ? fmt(l.value) : "-"}</td>
                          <td>
                            <span className={`nx-pill nx-pill-${l.status}`}>
                              {STAGE_MAP[l.status]}
                            </span>
                          </td>
                          <td>
                            {l.followUpDate
                              ? new Date(l.followUpDate).toLocaleDateString(
                                  "en-IN",
                                )
                              : "-"}
                          </td>
                          <td>
                            <button
                              className="nx-del-btn"
                              onClick={() => deleteLead(l._id, l.name)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {meta.pages > 1 && (
                <div className="nx-pager">
                  <button
                    className="nx-filter-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} / {meta.pages}
                  </span>
                  <button
                    className="nx-filter-btn"
                    disabled={page >= meta.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
