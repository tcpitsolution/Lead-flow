import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Phone, Mail, Globe, MessageCircle, Building2, Trash2, ChevronDown } from "lucide-react";

const Instagram = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const Facebook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const Linkedin = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
const Twitter = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import "./Dashboard.css";

const STATUSES = ["new", "contacted", "interested", "won", "lost"];
const STAGE_MAP = {
  new: "Prospecting", contacted: "Qualification",
  interested: "Proposal", won: "Closed Won", lost: "Closed Lost",
};
const STATUS_COLOR = {
  new: { bg: "rgba(116,143,252,0.18)", color: "#748ffc" },
  contacted: { bg: "rgba(77,171,247,0.18)", color: "#4dabf7" },
  interested: { bg: "rgba(255,212,59,0.18)", color: "#ffd43b" },
  won: { bg: "rgba(81,207,102,0.18)", color: "#51cf66" },
  lost: { bg: "rgba(255,107,107,0.18)", color: "#ff6b6b" },
};
const CURRENCIES = ["USD","INR","EUR","GBP","AED","SGD","AUD","CAD","JPY","CNY"];

function fmt(amount, currency) {
  const sym = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (amount >= 1000000) return `${sym}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(0)}k`;
  return `${sym}${amount}`;
}

function waUrl(phone) {
  if (!phone) return "";
  const d = String(phone).replace(/\D/g, "");
  const num = d.length === 10 ? `91${d}` : d;
  return num.length >= 10 ? `https://wa.me/${num}` : "";
}

function socialUrl(value, type) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const v = value.replace(/^@/, "").trim();
  if (!v || /\s/.test(v)) return "";
  const map = {
    instagram: `https://instagram.com/${v}`,
    facebook: `https://facebook.com/${v}`,
    linkedin: `https://linkedin.com/in/${v}`,
    twitter: `https://x.com/${v}`,
  };
  return map[type] || "";
}

/* ── Action Button ── */
function ABtn({ href, icon: Icon, label, bg, color, border }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 13px", borderRadius: 9, fontSize: 12, fontWeight: 600,
    textDecoration: "none", border: `1px solid ${border}`,
    background: bg, color, whiteSpace: "nowrap",
  };
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={base}>
      <Icon size={13} /> {label}
    </a>
  );
}

/* ── Contact Tile ── */
function CTile({ icon: Icon, label, value, href, color = "#74c0fc" }) {
  if (!value) return null;
  const inner = (
    <div className="lc-tile">
      <div className="lc-tile-icon"><Icon size={15} /></div>
      <div>
        <div className="lc-tile-label">{label}</div>
        <div className="lc-tile-value" style={{ color }}>{value}</div>
      </div>
    </div>
  );
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>
    : inner;
}

/* ── Status Select ── */
function StatusSelect({ lead, onChange }) {
  const sc = STATUS_COLOR[lead.status] || STATUS_COLOR.new;
  return (
    <div className="lc-status-wrap" style={{ background: sc.bg, borderColor: sc.color + "55" }}>
      <select
        value={lead.status}
        onChange={(e) => onChange(lead._id, e.target.value)}
        style={{ color: sc.color }}
        className="lc-status-select"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}
      </select>
      <ChevronDown size={11} style={{ color: sc.color, flexShrink: 0, pointerEvents: "none" }} />
    </div>
  );
}

/* ── Single Lead Card ── */
function LeadCard({ lead, checked, onToggle, onDelete, onStatusChange, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({ name: "", followUpDate: "", conversionStartDate: "", problemNote: "" });
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = () => {
    setEf({
      name: lead.name || "",
      company: lead.company || "",
      phone: lead.phone || "",
      email: lead.email || "",
      workEmail: lead.workEmail || "",
      linkedinId: lead.linkedinId || "",
      instagramId: lead.instagramId || "",
      facebookId: lead.facebookId || "",
      twitterId: lead.twitterId || "",
      websiteUrl: lead.websiteUrl || "",
      dealAmount: lead.dealAmount || "",
      dealCurrency: lead.dealCurrency || "USD",
      stage: lead.stage || "",
      stageNote: lead.stageNote || "",
      status: lead.status || "new",
      source: lead.source || "manual",
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 10) : "",
      conversionStartDate: lead.conversionStartDate ? new Date(lead.conversionStartDate).toISOString().slice(0, 10) : "",
      problemNote: lead.problemNote || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    try {
      const body = {};
      Object.entries(ef).forEach(([k, v]) => { body[k] = typeof v === "string" ? v.trim() : v; });
      if (body.dealAmount) body.dealAmount = Number(body.dealAmount);
      await onEdit(lead._id, body);
      setEditing(false);
    } finally { setEditSaving(false); }
  };

  const wa = waUrl(lead.phone);
  const igUrl = socialUrl(lead.instagramId, "instagram");
  const fbUrl = socialUrl(lead.facebookId, "facebook");
  const liUrl = socialUrl(lead.linkedinId, "linkedin");
  const twUrl = socialUrl(lead.twitterId, "twitter");

  return (
    <div className="lc-card">
      {/* Header */}
      <div className="lc-header">
        <input type="checkbox" className="lc-check" checked={checked} onChange={onToggle} aria-label={`Select ${lead.name || "lead"}`} />
        <div className="lc-avatar"><Building2 size={18} /></div>
        <div className="lc-head-info">
          <div className="lc-name">{lead.name || <span style={{ opacity: 0.4 }}>No name</span>}</div>
          {lead.company && <div className="lc-company">{lead.company}</div>}
        </div>
        <div className="lc-head-right">
          {lead.stage && (
            <span className="lc-badge lc-badge-stage">{lead.stage === "website-seo" ? "Website SEO" : "Other"}</span>
          )}
          <StatusSelect lead={lead} onChange={onStatusChange} />
          {lead.dealAmount > 0 && <span className="lc-deal">{fmt(lead.dealAmount, lead.dealCurrency)}</span>}
          <button className="lc-edit-btn" onClick={openEdit} aria-label="Edit">✏️</button>
          <button className="lc-del" onClick={() => onDelete(lead._id, lead.name)} aria-label="Delete"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="lc-edit-panel">
          <div className="lc-edit-grid">
            <div className="nx-field"><label>Name</label><input value={ef.name} onChange={(e) => setEf({...ef, name: e.target.value})} placeholder="Lead name" /></div>
            <div className="nx-field"><label>Company</label><input value={ef.company} onChange={(e) => setEf({...ef, company: e.target.value})} placeholder="Company" /></div>
            <div className="nx-field"><label>Phone</label><input value={ef.phone} onChange={(e) => setEf({...ef, phone: e.target.value})} placeholder="Phone" /></div>
            <div className="nx-field"><label>Email</label><input type="email" value={ef.email} onChange={(e) => setEf({...ef, email: e.target.value})} placeholder="Email" /></div>
            <div className="nx-field"><label>Work Email</label><input type="email" value={ef.workEmail} onChange={(e) => setEf({...ef, workEmail: e.target.value})} placeholder="work@company.com" /></div>
            <div className="nx-field"><label>LinkedIn ID</label><input value={ef.linkedinId} onChange={(e) => setEf({...ef, linkedinId: e.target.value})} placeholder="linkedin.com/in/username" /></div>
            <div className="nx-field"><label>Instagram ID</label><input value={ef.instagramId} onChange={(e) => setEf({...ef, instagramId: e.target.value})} placeholder="@username" /></div>
            <div className="nx-field"><label>Facebook ID</label><input value={ef.facebookId} onChange={(e) => setEf({...ef, facebookId: e.target.value})} placeholder="facebook.com/username" /></div>
            <div className="nx-field"><label>Twitter / X ID</label><input value={ef.twitterId} onChange={(e) => setEf({...ef, twitterId: e.target.value})} placeholder="@username" /></div>
            <div className="nx-field"><label>Website URL</label><input value={ef.websiteUrl} onChange={(e) => setEf({...ef, websiteUrl: e.target.value})} placeholder="https://example.com" /></div>
            <div className="nx-field nx-field-deal">
              <label>Deal Amount</label>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <select value={ef.dealCurrency} onChange={(e) => setEf({...ef, dealCurrency: e.target.value})} style={{width:80, flexShrink:0}}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" value={ef.dealAmount} onChange={(e) => setEf({...ef, dealAmount: e.target.value})} placeholder="Amount" min="0" style={{flex:1, minWidth:0}} />
              </div>
            </div>
            <div className="nx-field">
              <label>Stage</label>
              <select value={ef.stage} onChange={(e) => setEf({...ef, stage: e.target.value})}>
                <option value="">-- Select Stage --</option>
                <option value="website-seo">Website SEO</option>
                <option value="other">Other</option>
              </select>
            </div>
            {ef.stage === "other" && (
              <div className="nx-field nx-field-full">
                <label>Stage Details</label>
                <textarea value={ef.stageNote} onChange={(e) => setEf({...ef, stageNote: e.target.value})} rows={2} placeholder="Describe the stage..." />
              </div>
            )}
            <div className="nx-field">
              <label>Status</label>
              <select value={ef.status} onChange={(e) => setEf({...ef, status: e.target.value})}>
                {STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}
              </select>
            </div>
            <div className="nx-field">
              <label>Source</label>
              <select value={ef.source} onChange={(e) => setEf({...ef, source: e.target.value})}>
                <option value="manual">Manual</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="call">Call</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="nx-field"><label>Follow-up Date</label><input type="date" value={ef.followUpDate} onChange={(e) => setEf({...ef, followUpDate: e.target.value})} /></div>
            <div className="nx-field"><label>Conversion Start Date</label><input type="date" value={ef.conversionStartDate} onChange={(e) => setEf({...ef, conversionStartDate: e.target.value})} /></div>
            <div className="nx-field nx-field-full">
              <label>Problem / Notes</label>
              <textarea value={ef.problemNote} onChange={(e) => setEf({...ef, problemNote: e.target.value})} rows={3} placeholder="Any problem or notes..." />
            </div>
          </div>
          <div className="lc-edit-actions">
            <button className="nx-add-btn" onClick={saveEdit} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</button>
            <button className="nx-filter-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Contact tiles */}
      <div className="lc-tiles">
        <CTile icon={Phone} label="PHONE" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : ""} color="#69db7c" />
        <CTile icon={MessageCircle} label="WHATSAPP" value={wa ? lead.phone : ""} href={wa} color="#69db7c" />
        <CTile icon={Mail} label="EMAIL" value={lead.email} href={lead.email ? `mailto:${lead.email}` : ""} />
        <CTile icon={Mail} label="WORK EMAIL" value={lead.workEmail} href={lead.workEmail ? `mailto:${lead.workEmail}` : ""} />
        <CTile icon={Globe} label="WEBSITE" value={lead.websiteUrl} href={lead.websiteUrl} color="#a9e34b" />
        {igUrl && <CTile icon={Instagram} label="INSTAGRAM" value={lead.instagramId} href={igUrl} color="#da77f2" />}
        {fbUrl && <CTile icon={Facebook} label="FACEBOOK" value={lead.facebookId} href={fbUrl} />}
        {liUrl && <CTile icon={Linkedin} label="LINKEDIN" value={lead.linkedinId} href={liUrl} />}
        {twUrl && <CTile icon={Twitter} label="TWITTER/X" value={lead.twitterId} href={twUrl} color="#74c0fc" />}
      </div>

      {/* Meta row */}
      {(lead.followUpDate || lead.conversionStartDate || lead.source) && (
        <div className="lc-meta-row">
          {lead.source && <span className="lc-meta-chip">Source: {lead.source}</span>}
          {lead.followUpDate && <span className="lc-meta-chip">Follow-up: {new Date(lead.followUpDate).toLocaleDateString("en-IN")}</span>}
          {lead.conversionStartDate && <span className="lc-meta-chip">Conv. Start: {new Date(lead.conversionStartDate).toLocaleDateString("en-IN")}</span>}
          {lead.stage === "other" && lead.stageNote && <span className="lc-meta-chip">Stage note: {lead.stageNote}</span>}
        </div>
      )}

      {/* Problem note */}
      {lead.problemNote && <div className="lc-problem-note">⚠ {lead.problemNote}</div>}

      {/* Action buttons */}
      <div className="lc-actions">
        <ABtn href={lead.phone ? `tel:${lead.phone}` : ""} icon={Phone} label="Call" bg="rgba(81,207,102,0.12)" color="#69db7c" border="rgba(81,207,102,0.3)" />
        <ABtn href={wa} icon={MessageCircle} label="WhatsApp" bg="rgba(37,211,102,0.12)" color="#69db7c" border="rgba(37,211,102,0.3)" />
        <ABtn href={lead.email ? `mailto:${lead.email}` : ""} icon={Mail} label="Email" bg="rgba(77,171,247,0.12)" color="#74c0fc" border="rgba(77,171,247,0.3)" />
        <ABtn href={igUrl} icon={Instagram} label="Instagram" bg="rgba(218,119,242,0.12)" color="#e599f7" border="rgba(218,119,242,0.3)" />
        <ABtn href={fbUrl} icon={Facebook} label="Facebook" bg="rgba(77,171,247,0.12)" color="#74c0fc" border="rgba(77,171,247,0.3)" />
        <ABtn href={liUrl} icon={Linkedin} label="LinkedIn" bg="rgba(77,171,247,0.12)" color="#74c0fc" border="rgba(77,171,247,0.3)" />
        <ABtn href={twUrl} icon={Twitter} label="Twitter/X" bg="rgba(116,143,252,0.12)" color="#748ffc" border="rgba(116,143,252,0.3)" />
        <ABtn href={lead.websiteUrl} icon={Globe} label="Website" bg="rgba(169,227,75,0.1)" color="#a9e34b" border="rgba(169,227,75,0.28)" />
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [selected, setSelected] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", phone: "", email: "", workEmail: "",
    linkedinId: "", instagramId: "", facebookId: "", twitterId: "",
    websiteUrl: "", problemNote: "", conversionStartDate: "",
    dealAmount: "", dealCurrency: "USD",
    source: "manual", stage: "", stageNote: "",
    status: "new", followUpDate: "",
  });
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

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const EMPTY_FORM = {
    name: "", company: "", phone: "", email: "", workEmail: "",
    linkedinId: "", instagramId: "", facebookId: "", twitterId: "",
    websiteUrl: "", problemNote: "", conversionStartDate: "",
    dealAmount: "", dealCurrency: "USD",
    source: "manual", stage: "", stageNote: "",
    status: "new", followUpDate: "",
  };

  const addLead = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => String(v).trim() !== ""));
      if (body.dealAmount) body.dealAmount = Number(body.dealAmount);
      await api("/leads", { method: "POST", body });
      setForm(EMPTY_FORM); setShowForm(false); load();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const editLead = async (id, body) => {
    const updated = await api(`/leads/${id}`, { method: "PUT", body });
    setLeads(leads.map((l) => (l._id === id ? updated.lead : l)));
  };

  const deleteLead = async (id, name) => {
    if (!window.confirm(`Delete "${name || "this lead"}"?`)) return;
    try { await api(`/leads/${id}`, { method: "DELETE" }); load(); } catch {}
  };

  const changeStatus = async (id, newStatus) => {
    setLeads(leads.map((l) => (l._id === id ? { ...l, status: newStatus } : l)));
    try { await api(`/leads/${id}`, { method: "PUT", body: { status: newStatus } }); }
    catch { load(); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAll = () => setSelected(selected.size === leads.length ? new Set() : new Set(leads.map((l) => l._id)));

  const exportExcel = async () => {
    let allLeads = [];
    try {
      const q = new URLSearchParams({ limit: 1000 });
      if (search.trim()) q.set("search", search.trim());
      if (statusFilter) q.set("status", statusFilter);
      const data = await api(`/leads?${q}`);
      allLeads = data.items || [];
    } catch { return; }

    const rows = allLeads.map((l) => ({
      Name: l.name || "", Company: l.company || "", Phone: l.phone || "",
      Email: l.email || "", "Work Email": l.workEmail || "",
      "LinkedIn ID": l.linkedinId || "", "Instagram ID": l.instagramId || "",
      "Facebook ID": l.facebookId || "", "Twitter/X ID": l.twitterId || "",
      "Website URL": l.websiteUrl || "",
      "Deal Amount": l.dealAmount ? `${l.dealCurrency || "USD"} ${l.dealAmount}` : "",
      Stage: l.stage === "website-seo" ? "Website SEO" : l.stage === "other" ? `Other: ${l.stageNote || ""}` : "",
      Status: STAGE_MAP[l.status] || l.status, Source: l.source || "",
      "Follow-up Date": l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-IN") : "",
      "Conversion Start": l.conversionStartDate ? new Date(l.conversionStartDate).toLocaleDateString("en-IN") : "",
      "Problem/Notes": l.problemNote || "",
      "Created At": new Date(l.createdAt).toLocaleDateString("en-IN"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [20,20,15,28,28,24,18,22,18,30,18,20,16,12,14,18,40,14].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />
        <main className="nx-main">

          {/* Page header */}
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Leads</h1>
              <p className="nx-page-sub">{meta.total} total leads{selected.size > 0 && ` · ${selected.size} selected`}</p>
            </div>
            <div className="nx-page-actions">
              {leads.length > 0 && (
                <button className="nx-filter-btn" onClick={toggleAll}>
                  {selected.size === leads.length ? "Deselect All" : "Select All"}
                </button>
              )}
              <select className="nx-filter-btn" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}
              </select>
              <button className="nx-filter-btn" onClick={exportExcel}>⬇ Export Excel</button>
              <button className="nx-add-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? "✕ Cancel" : "+ Add Lead"}
              </button>
            </div>
          </div>

          {/* Add Lead Form */}
          {showForm && (
            <form className="nx-add-form" onSubmit={addLead} noValidate>
              <div className="nx-form-grid">
                <div className="nx-field"><label>Name</label><input value={form.name} onChange={f("name")} placeholder="Lead name (optional)" /></div>
                <div className="nx-field"><label>Company</label><input value={form.company} onChange={f("company")} placeholder="Company" /></div>
                <div className="nx-field"><label>Phone</label><input value={form.phone} onChange={f("phone")} placeholder="Phone" /></div>
                <div className="nx-field"><label>Email</label><input type="email" value={form.email} onChange={f("email")} placeholder="Email" /></div>
                <div className="nx-field"><label>Work Email</label><input type="email" value={form.workEmail} onChange={f("workEmail")} placeholder="work@company.com" /></div>
                <div className="nx-field"><label>LinkedIn ID</label><input value={form.linkedinId} onChange={f("linkedinId")} placeholder="linkedin.com/in/username" /></div>
                <div className="nx-field"><label>Instagram ID</label><input value={form.instagramId} onChange={f("instagramId")} placeholder="@username" /></div>
                <div className="nx-field"><label>Facebook ID</label><input value={form.facebookId} onChange={f("facebookId")} placeholder="facebook.com/username" /></div>
                <div className="nx-field"><label>Twitter / X ID</label><input value={form.twitterId} onChange={f("twitterId")} placeholder="@username" /></div>
                <div className="nx-field"><label>Website URL</label><input value={form.websiteUrl} onChange={f("websiteUrl")} placeholder="https://example.com" /></div>
                <div className="nx-field nx-field-deal">
                  <label>Deal Amount</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select value={form.dealCurrency} onChange={f("dealCurrency")} style={{ width: 80, flexShrink: 0 }}>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" value={form.dealAmount} onChange={f("dealAmount")} placeholder="Amount" min="0" style={{ flex: 1, minWidth: 0 }} />
                  </div>
                </div>
                <div className="nx-field">
                  <label>Stage</label>
                  <select value={form.stage} onChange={f("stage")}>
                    <option value="">-- Select Stage --</option>
                    <option value="website-seo">Website SEO</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {form.stage === "other" && (
                  <div className="nx-field nx-field-full">
                    <label>Stage Details</label>
                    <textarea value={form.stageNote} onChange={f("stageNote")} placeholder="Describe the stage..." rows={2} />
                  </div>
                )}
                <div className="nx-field">
                  <label>Status</label>
                  <select value={form.status} onChange={f("status")}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STAGE_MAP[s]}</option>)}
                  </select>
                </div>
                <div className="nx-field">
                  <label>Source</label>
                  <select value={form.source} onChange={f("source")}>
                    <option value="manual">Manual</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="call">Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="nx-field"><label>Follow-up Date</label><input type="date" value={form.followUpDate} onChange={f("followUpDate")} /></div>
                <div className="nx-field"><label>Conversion Start Date</label><input type="date" value={form.conversionStartDate} onChange={f("conversionStartDate")} /></div>
                <div className="nx-field nx-field-full">
                  <label>Problem / Notes</label>
                  <textarea value={form.problemNote} onChange={f("problemNote")} placeholder="Any problem or notes about this lead..." rows={3} />
                </div>
              </div>
              {formError && <p className="nx-form-err">{formError}</p>}
              <button className="nx-add-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Lead"}</button>
            </form>
          )}

          {/* Loading */}
          {loading && (
            <div className="lc-empty-state">
              <div className="lc-empty-icon">⏳</div>
              <p>Loading leads...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && leads.length === 0 && (
            <div className="lc-empty-state">
              <div className="lc-empty-icon"><Building2 size={48} opacity={0.3} /></div>
              <h2>No leads yet</h2>
              <p>Click "+ Add Lead" to add your first lead.</p>
            </div>
          )}

          {/* Cards */}
          {!loading && leads.length > 0 && (
            <div className="lc-list">
              {leads.map((l) => (
                <LeadCard
                  key={l._id}
                  lead={l}
                  checked={selected.has(l._id)}
                  onToggle={() => toggleSelect(l._id)}
                  onDelete={deleteLead}
                  onStatusChange={changeStatus}
                  onEdit={editLead}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
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
