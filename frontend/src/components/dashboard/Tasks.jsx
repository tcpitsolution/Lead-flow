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

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Overdue", color: "#e03131" };
  if (diff === 0) return { label: "Today", color: "#e6a800" };
  if (diff === 1) return { label: "Tomorrow", color: "#2f9e44" };
  return { label: d.toLocaleDateString("en-IN"), color: "var(--text-muted)" };
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [noDate, setNoDate] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/leads?limit=100");
      const items = data.items || [];
      setTasks(
        items
          .filter((l) => l.followUpDate && l.status !== "won" && l.status !== "lost")
          .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      );
      setNoDate(items.filter((l) => !l.followUpDate && l.status !== "won" && l.status !== "lost"));
    } catch {
      setTasks([]);
      setNoDate([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = tasks.length + noDate.length;

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Tasks</h1>
              <p className="nx-page-sub">{total} open follow-ups</p>
            </div>
          </div>

          {loading && <div className="nx-empty">Loading...</div>}

          {!loading && total === 0 && (
            <div className="nx-empty-state">
              <div className="nx-empty-icon">✅</div>
              <h2>All caught up!</h2>
              <p>No open follow-up tasks. Add follow-up dates to leads to track them here.</p>
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <>
              <h3 className="nx-section-title">Scheduled Follow-ups</h3>
              <div className="nx-table-wrap" style={{ marginBottom: 20 }}>
                <table>
                  <thead>
                    <tr><th>Lead</th><th>Company</th><th>Stage</th><th>Follow-up</th></tr>
                  </thead>
                  <tbody>
                    {tasks.map((l) => {
                      const { label, color } = dayLabel(l.followUpDate);
                      return (
                        <tr key={l._id}>
                          <td style={{ fontWeight: 600 }}>{l.name}</td>
                          <td>{l.company || "—"}</td>
                          <td><span className={`nx-pill nx-pill-${l.status}`}>{STAGE_MAP[l.status]}</span></td>
                          <td style={{ color, fontWeight: 600 }}>{label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && noDate.length > 0 && (
            <>
              <h3 className="nx-section-title">No Follow-up Date Set</h3>
              <div className="nx-table-wrap">
                <table>
                  <thead>
                    <tr><th>Lead</th><th>Company</th><th>Stage</th></tr>
                  </thead>
                  <tbody>
                    {noDate.map((l) => (
                      <tr key={l._id}>
                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                        <td>{l.company || "—"}</td>
                        <td><span className={`nx-pill nx-pill-${l.status}`}>{STAGE_MAP[l.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
