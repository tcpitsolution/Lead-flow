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

function fmt(num) {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num}`;
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/leads?limit=100");
      const map = {};
      (data.items || []).forEach((l) => {
        const key = l.company?.trim() || "—";
        if (!map[key]) map[key] = { name: key, leads: [], totalValue: 0 };
        map[key].leads.push(l);
        map[key].totalValue += l.value || 0;
      });
      setCompanies(Object.values(map).sort((a, b) => b.totalValue - a.totalValue));
    } catch {
      setCompanies([]);
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
              <h1 className="nx-page-title">Companies</h1>
              <p className="nx-page-sub">{companies.length} companies from your leads</p>
            </div>
          </div>

          {loading && <div className="nx-empty">Loading...</div>}

          {!loading && companies.length === 0 && (
            <div className="nx-empty-state">
              <div className="nx-empty-icon">🏢</div>
              <h2>No companies yet</h2>
              <p>Add leads with company names to see them grouped here.</p>
            </div>
          )}

          {!loading && companies.length > 0 && (
            <div className="nx-table-wrap">
              <table>
                <thead>
                  <tr><th>Company</th><th>Leads</th><th>Pipeline Value</th><th>Stages</th></tr>
                </thead>
                <tbody>
                  {companies.map((c) => {
                    const stages = [...new Set(c.leads.map((l) => l.status))];
                    return (
                      <tr key={c.name}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.leads.length}</td>
                        <td>{c.totalValue > 0 ? fmt(c.totalValue) : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {stages.map((s) => <span key={s} className={`nx-pill nx-pill-${s}`}>{STAGE_MAP[s]}</span>)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
