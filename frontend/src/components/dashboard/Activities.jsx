import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import "./Dashboard.css";

const STAGE_MAP = {
  new: "Prospecting",
  contacted: "Qualification",
  interested: "Proposal",
  won: "Closed Won",
  lost: "Closed Lost",
};

const STATUS_ICON = { new: "🔵", contacted: "📞", interested: "⭐", won: "✅", lost: "❌" };

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/leads?limit=100");
      setActivities(
        (data.items || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Activities</h1>
              <p className="nx-page-sub">Recent lead activity timeline</p>
            </div>
          </div>

          {loading && <div className="nx-empty">Loading...</div>}

          {!loading && activities.length === 0 && (
            <div className="nx-empty-state">
              <div className="nx-empty-icon">⏱</div>
              <h2>No activities yet</h2>
              <p>Lead updates will appear here as a timeline.</p>
            </div>
          )}

          {!loading && activities.length > 0 && (
            <div className="nx-timeline-card" style={{ maxWidth: 640 }}>
              {activities.map((lead, i) => (
                <div key={lead._id} className="nx-timeline-item">
                  <div className={`nx-timeline-dot${i === 0 ? " check" : " blue"}`}>
                    {STATUS_ICON[lead.status] || "•"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="nx-timeline-date">
                      {lead.name}
                      {lead.company && (
                        <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> · {lead.company}</span>
                      )}
                    </div>
                    <div className="nx-timeline-desc">
                      <span className={`nx-pill nx-pill-${lead.status}`}>{STAGE_MAP[lead.status]}</span>
                      {" "}· Updated {new Date(lead.updatedAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  {lead.value > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#4dabf7" }}>
                      ${lead.value.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
