import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import "./Dashboard.css";

const STATUSES = ["new", "contacted", "interested", "won", "lost"];
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

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", value: "", status: "new", followUpDate: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 15 });
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
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const addLead = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Name required");
    setSaving(true);
    setFormError("");
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => String(v).trim() !== ""));
      if (body.value) body.value = Number(body.value);
      await api("/leads", { method: "POST", body });
      setForm({ name: "", company: "", phone: "", email: "", value: "", status: "new", followUpDate: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await api(`/leads/${id}`, { method: "DELETE" }); load(); } catch {}
  };

  const exportExcel = async () => {
    // Fetch ALL leads (no pagination) for export
    let allLeads = [];
    try {
      const q = new URLSearchParams({ limit: 1000 });
      if (search.trim()) q.set("search", search.trim());
      if (statusFilter) q.set("status", statusFilter);
      const data = await api(`/leads?${q}`);
      allLeads = data.items || [];
    } catch { return; }

    const rows = allLeads.map((l) => ({
      Name: l.name,
      Company: l.company || "",
      Phone: l.phone || "",
      Email: l.email || "",
      "Deal Value": l.value || 0,
      Stage: STAGE_MAP[l.status] || l.status,
      "Follow-up Date": l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-IN") : "",
      "Created At": new Date(l.createdAt).toLocaleDateString("en-IN"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws["!cols"] = [20, 20, 15, 28, 12, 16, 14, 14].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const changeStatus = async (id, newStatus) => {
    setLeads(leads.map((l) => (l._id === id ? { ...l, status: newStatus } : l)));
    try {
      await api(`/leads/${id}`, { method: "PUT", body: { status: newStatus } });
    } catch { load(); }
  };

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Leads</h1>
              <p className="nx-page-sub">{meta.total} total leads</p>
            </div>
            <div className="nx-page-actions">
              <select className="nx-filter-btn" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}
              </select>
              <button className="nx-filter-btn" onClick={exportExcel} title="Export to Excel">
                ⬇ Export Excel
              </button>
              <button className="nx-add-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? "✕ Cancel" : "+ Add Lead"}
              </button>
            </div>
          </div>

          {showForm && (
            <form className="nx-add-form" onSubmit={addLead} noValidate>
              <div className="nx-form-grid">
                <div className="nx-field"><label>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lead name" /></div>
                <div className="nx-field"><label>Company</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" /></div>
                <div className="nx-field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" /></div>
                <div className="nx-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" /></div>
                <div className="nx-field"><label>Deal Value</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" min="0" /></div>
                <div className="nx-field"><label>Stage</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}</select></div>
                <div className="nx-field"><label>Follow-up Date</label><input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></div>
              </div>
              {formError && <p className="nx-form-err">{formError}</p>}
              <button className="nx-add-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Lead"}</button>
            </form>
          )}

          <div className="nx-table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Company</th><th>Phone</th><th>Email</th><th>Value</th><th>Status</th><th>Follow-up</th><th></th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="8" className="nx-empty">Loading...</td></tr>}
                {!loading && leads.length === 0 && <tr><td colSpan="8" className="nx-empty">No leads found</td></tr>}
                {!loading && leads.map((l) => (
                  <tr key={l._id}>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>{l.company || "—"}</td>
                    <td>{l.phone || "—"}</td>
                    <td>{l.email || "—"}</td>
                    <td>{l.value > 0 ? fmt(l.value) : "—"}</td>
                    <td>
                      <select className={`nx-pill nx-pill-${l.status}`} value={l.status} onChange={(e) => changeStatus(l._id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}
                      </select>
                    </td>
                    <td>{l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td><button className="nx-del-btn" onClick={() => deleteLead(l._id, l.name)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div className="nx-pager">
              <button className="nx-filter-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} / {meta.pages}</span>
              <button className="nx-filter-btn" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
