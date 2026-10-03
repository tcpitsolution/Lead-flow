import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import "./Dashboard.css";

const COUNTRIES = [
  ["in", "India"],
  ["us", "United States"],
  ["gb", "United Kingdom"],
  ["ca", "Canada"],
  ["au", "Australia"],
  ["ae", "UAE"],
  ["sa", "Saudi Arabia"],
  ["qa", "Qatar"],
  ["kw", "Kuwait"],
  ["om", "Oman"],
  ["bh", "Bahrain"],
  ["sg", "Singapore"],
  ["my", "Malaysia"],
  ["th", "Thailand"],
  ["id", "Indonesia"],
  ["ph", "Philippines"],
  ["vn", "Vietnam"],
  ["bd", "Bangladesh"],
  ["pk", "Pakistan"],
  ["lk", "Sri Lanka"],
  ["np", "Nepal"],
  ["de", "Germany"],
  ["fr", "France"],
  ["it", "Italy"],
  ["es", "Spain"],
  ["nl", "Netherlands"],
  ["ie", "Ireland"],
  ["ch", "Switzerland"],
  ["se", "Sweden"],
  ["tr", "Turkey"],
  ["eg", "Egypt"],
  ["ng", "Nigeria"],
  ["ke", "Kenya"],
  ["za", "South Africa"],
  ["br", "Brazil"],
  ["mx", "Mexico"],
  ["jp", "Japan"],
  ["kr", "South Korea"],
  ["cn", "China"],
  ["nz", "New Zealand"],
];

const CATEGORIES = [
  "Dentist",
  "Doctor / Clinic",
  "Hospital",
  "Pharmacy",
  "Restaurant",
  "Cafe",
  "Bakery",
  "Hotel",
  "Salon",
  "Spa",
  "Gym",
  "School / Coaching",
  "Lawyer",
  "CA / Accountant",
  "Architect / Interior designer",
  "IT / Software company",
  "Marketing agency",
  "Real estate",
  "Insurance",
  "Travel agency",
  "Logistics / Courier",
  "Photographer",
  "Wedding / Event",
  "Clothing / Boutique",
  "Jewellery",
  "Mobile / Electronics",
  "Furniture",
  "Hardware",
  "Car repair / Garage",
  "Pet / Vet",
  "Grocery / Supermarket",
  "Factory / Manufacturer",
];

const RADII = [
  [3000, "3 km (small area)"],
  [8000, "8 km (whole city)"],
  [15000, "15 km"],
  [25000, "25 km (large city)"],
];

function exportToCSV(rows, filename) {
  const cols = [
    "Name", "Address", "Phone", "Email", "Website",
    "Instagram", "Facebook", "LinkedIn", "Score", "Category", "City", "Maps URL",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    cols.join(","),
    ...rows.map((p) =>
      [
        p.name, p.address, p.phone,
        p.emails?.[0] ?? p.email ?? "",
        p.website, p.instagram, p.facebook, p.linkedin,
        p.aiScore ?? p.score ?? "",
        p.category ?? "", p.city ?? "", p.mapsUrl ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const linkStyle = { color: "#4dabf7" };
const selectStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  fontSize: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--text, #e8eaff)",
  colorScheme: "dark",
};

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
};
// Opens Google Maps by business name/address
const mapLink = (p) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || p.name)}`;
const googleFor = (p, city, extra) =>
  `https://www.google.com/search?q=${encodeURIComponent([p.name, city, extra].filter(Boolean).join(" "))}`;

/* ---------- small components ---------- */

function Check({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        flexShrink: 0,
        padding: 0,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        border: checked
          ? "1px solid #4da3ff"
          : "1px solid rgba(255,255,255,0.28)",
        background: checked
          ? "linear-gradient(135deg,#4da3ff,#7b8cff)"
          : "rgba(255,255,255,0.04)",
      }}
    >
      {checked ? "✓" : ""}
    </button>
  );
}

function Chip({ ok, label, text, href }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 99,
    fontSize: 12,
  };
  if (!ok) {
    return (
      <span
        style={{
          ...base,
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-muted)",
        }}
      >
        ✗ {label}
      </span>
    );
  }
  const style = {
    ...base,
    background: "rgba(47,158,68,0.16)",
    color: "#51cf66",
    textDecoration: "none",
  };
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
      ✓ {text || label}
    </a>
  ) : (
    <span style={style}>✓ {text || label}</span>
  );
}

function Contacts({ p, city }) {
  const email = p.emails?.[0];
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <Chip
          ok={!!p.phone}
          label="Phone"
          text={p.phone}
          href={p.phone ? `tel:${p.phone.replace(/[^\d+]/g, "")}` : ""}
        />
        <Chip
          ok={!!email}
          label="Email"
          text={email}
          href={email ? `mailto:${email}` : ""}
        />
        <Chip
          ok={!!p.website}
          label="Website"
          text={p.website ? host(p.website) : ""}
          href={p.website}
        />
        <Chip ok={!!p.instagram} label="Instagram" href={p.instagram} />
        <Chip ok={!!p.facebook} label="Facebook" href={p.facebook} />
        <Chip ok={!!p.linkedin} label="LinkedIn" href={p.linkedin} />
        <a
          href={mapLink(p)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 99,
            fontSize: 12,
            background: "rgba(77,171,247,0.14)",
            color: "#4dabf7",
            textDecoration: "none",
          }}
        >
          📍 Google Map
        </a>
      </div>

      {(!p.phone ||
        !email ||
        !p.website ||
        !p.instagram ||
        !p.facebook ||
        !p.linkedin) && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
          Find manually:{" "}
          {(!p.phone || !email || !p.website) && (
            <>
              <a
                href={googleFor(p, city, "contact phone email")}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Google
              </a>
              {" · "}
            </>
          )}
          {!p.instagram && (
            <>
              <a
                href={googleFor(p, city, "site:instagram.com")}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Instagram
              </a>
              {" · "}
            </>
          )}
          {!p.facebook && (
            <>
              <a
                href={googleFor(p, city, "site:facebook.com")}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Facebook
              </a>
              {" · "}
            </>
          )}
          {!p.linkedin && (
            <a
              href={googleFor(p, city, "site:linkedin.com")}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </>
  );
}

function ScoreBadge({ value }) {
  const v = value ?? 0;
  const bg =
    v >= 70
      ? "linear-gradient(135deg,#51cf66,#2f9e44)"
      : v >= 40
        ? "linear-gradient(135deg,#ffd43b,#e67700)"
        : "linear-gradient(135deg,#ff6b6b,#e03131)";
  return (
    <div style={{ textAlign: "center", minWidth: 56, flexShrink: 0 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 15,
          color: "#fff",
          background: bg,
        }}
      >
        {value ?? "-"}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
        Score
      </div>
    </div>
  );
}

const banner = (kind) => ({
  background: kind === "err" ? "rgba(224,49,49,0.1)" : "rgba(47,158,68,0.12)",
  border: `1px solid ${kind === "err" ? "rgba(224,49,49,0.2)" : "rgba(47,158,68,0.3)"}`,
  borderRadius: 10,
  padding: "12px 16px",
  marginBottom: 16,
  fontSize: 13,
  color: kind === "err" ? "#ff6b6b" : "#51cf66",
});

const tabBtn = (active) => ({
  padding: "9px 18px",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.1)",
  background: active
    ? "linear-gradient(135deg,#4da3ff,#7b8cff)"
    : "transparent",
  color: active ? "#fff" : "var(--text-sub)",
});

const quickBtn = (on) => ({
  padding: "6px 12px",
  borderRadius: 99,
  fontSize: 12,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.12)",
  background: on ? "rgba(77,163,255,0.2)" : "transparent",
  color: on ? "#7fb8ff" : "var(--text-sub)",
});

/* ---------- main page ---------- */

export default function ClientFinder() {
  const [tab, setTab] = useState("find"); // tabs: find | saved
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Find tab
  const [form, setForm] = useState({
    country: "in",
    city: "",
    catChoice: "Dentist",
    customCat: "",
    radius: 8000,
    limit: 10,
    onlyPhone: false,
    onlyWebsite: false,
    offer: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const category =
    form.catChoice === "__other" ? form.customCat.trim() : form.catChoice;

  const [lastSearch, setLastSearch] = useState({ category: "", city: "" });
  const [leads, setLeads] = useState([]);
  const [picked, setPicked] = useState([]);
  const [quick, setQuick] = useState({ email: false, social: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);

  // Saved tab
  const [prospects, setProspects] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [busyId, setBusyId] = useState("");

  const visible = useMemo(
    () =>
      leads.filter(
        (l) =>
          (!quick.email || l.emails?.length) &&
          (!quick.social || l.instagram || l.facebook || l.linkedin),
      ),
    [leads, quick],
  );
  const selectable = visible.filter((l) => !l.alreadySaved);
  const allOn =
    selectable.length > 0 &&
    selectable.every((l) => picked.includes(l.placeId));

  const cover = useMemo(
    () => ({
      total: leads.length,
      phone: leads.filter((l) => l.phone).length,
      email: leads.filter((l) => l.emails?.length).length,
      website: leads.filter((l) => l.website).length,
      social: leads.filter((l) => l.instagram || l.facebook || l.linkedin)
        .length,
    }),
    [leads],
  );

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setNotice("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (category.length < 2) return setError("Please select or enter a business type");
    if (form.city.trim().length < 2) return setError("Please enter a city name");

    setError("");
    setNotice("");
    setLeads([]);
    setPicked([]);
    setQuick({ email: false, social: false });
    setLoading(true);
    setSearched(true);
    try {
      const data = await api("/finder/search", {
        method: "POST",
        body: {
          category,
          city: form.city.trim(),
          offer: form.offer.trim(),
          country: form.country,
          radius: Number(form.radius),
          limit: Number(form.limit),
          onlyPhone: form.onlyPhone,
          onlyWebsite: form.onlyWebsite,
        },
      });
      setLastSearch({ category, city: form.city.trim() });
      setLeads(data.leads || []);
      if (!data.leads?.length)
        setError(
          "No businesses found. Try expanding the search area, removing filters, or changing the city.",
        );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () => {
    const ids = selectable.map((l) => l.placeId);
    setPicked((p) =>
      allOn ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])],
    );
  };

  const saveProspects = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const chosen = leads.filter((l) => picked.includes(l.placeId));
      const data = await api("/finder/save", {
        method: "POST",
        body: {
          items: chosen,
          category: lastSearch.category,
          city: lastSearch.city,
        },
      });
      setLeads((prev) =>
        prev.map((l) =>
          picked.includes(l.placeId) ? { ...l, alreadySaved: true } : l,
        ),
      );
      setPicked([]);
      setNotice(
        `${data.added} prospect(s) saved${data.skipped ? `, ${data.skipped} already existed` : ""}. Go to the "Saved Prospects" tab to convert them to leads.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (tab !== "saved") return;
    let alive = true;
    setSavedLoading(true);
    api("/finder/prospects?status=saved")
      .then((d) => alive && setProspects(d.prospects || []))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setSavedLoading(false));
    return () => {
      alive = false;
    };
  }, [tab]);

  const convert = async (p) => {
    setBusyId(p._id);
    setError("");
    setNotice("");
    try {
      await api(`/finder/prospects/${p._id}/convert`, { method: "POST" });
      setProspects((prev) => prev.filter((x) => x._id !== p._id));
      setNotice(`"${p.name}" has been added to your Leads list (status: new).`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const removeProspect = async (p) => {
    if (!window.confirm(`Remove "${p.name}"?`)) return;
    setBusyId(p._id);
    setError("");
    setNotice("");
    try {
      await api(`/finder/prospects/${p._id}`, { method: "DELETE" });
      setProspects((prev) => prev.filter((x) => x._id !== p._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="nx-shell">
      <AppSidebar />
      <div className="nx-body">
        <AppTopbar />
        <main className="nx-main">
          <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Client Finder</h1>
              <p className="nx-page-sub">
                Find potential clients, shortlist them, then convert to leads
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              style={tabBtn(tab === "find")}
              onClick={() => switchTab("find")}
            >
              🔍 Find
            </button>
            <button
              type="button"
              style={tabBtn(tab === "saved")}
              onClick={() => switchTab("saved")}
            >
              ⭐ Saved Prospects
            </button>
          </div>

          {error && <div style={banner("err")}>{error}</div>}
          {notice && <div style={banner("ok")}>{notice}</div>}

          {/* ================= FIND ================= */}
          {tab === "find" && (
            <>
              <div className="nx-add-form" style={{ marginBottom: 24 }}>
                <form onSubmit={handleSearch}>
                  <div className="nx-form-grid">
                    <div className="nx-field">
                      <label>Country *</label>
                      <select
                        style={selectStyle}
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                      >
                        {COUNTRIES.map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                        <option value="">Anywhere (no country filter)</option>
                      </select>
                    </div>
                    <div className="nx-field">
                      <label>City *</label>
                      <input
                        placeholder="e.g. Mumbai, Dubai, London"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        required
                      />
                    </div>

                    <div className="nx-field">
                      <label>Business Type *</label>
                      <select
                        style={selectStyle}
                        value={form.catChoice}
                        onChange={(e) => set("catChoice", e.target.value)}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__other">
                          Other (type your own)...
                        </option>
                      </select>
                    </div>
                    <div className="nx-field">
                      <label>Search area</label>
                      <select
                        style={selectStyle}
                        value={form.radius}
                        onChange={(e) => set("radius", e.target.value)}
                      >
                        {RADII.map(([v, t]) => (
                          <option key={v} value={v}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {form.catChoice === "__other" && (
                      <div
                        className="nx-field"
                        style={{ gridColumn: "span 2" }}
                      >
                        <label>Enter business type</label>
                        <input
                          placeholder="e.g. Yoga studio, Bank, Courier"
                          value={form.customCat}
                          onChange={(e) => set("customCat", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="nx-field">
                      <label>Number of results</label>
                      <select
                        style={selectStyle}
                        value={form.limit}
                        onChange={(e) => set("limit", e.target.value)}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>
                          50 (may take 30 to 60 seconds)
                        </option>
                        <option value={100}>
                          100 (may take 1 to 2 minutes)
                        </option>
                      </select>
                    </div>
                    <div className="nx-field">
                      <label>Filter in search</label>
                      <div
                        style={{
                          display: "flex",
                          gap: 18,
                          flexWrap: "wrap",
                          paddingTop: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                          onClick={() => set("onlyPhone", !form.onlyPhone)}
                        >
                          <Check
                            checked={form.onlyPhone}
                            onChange={() => set("onlyPhone", !form.onlyPhone)}
                            label="Phone only"
                          />
                          Phone only
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                          onClick={() => set("onlyWebsite", !form.onlyWebsite)}
                        >
                          <Check
                            checked={form.onlyWebsite}
                            onChange={() =>
                              set("onlyWebsite", !form.onlyWebsite)
                            }
                            label="Website only"
                          />
                          Website only
                        </div>
                      </div>
                    </div>

                    <div className="nx-field" style={{ gridColumn: "span 2" }}>
                      <label>Your Service / Offer (optional)</label>
                      <input
                        placeholder="e.g. Website design, Digital marketing, SEO services"
                        value={form.offer}
                        onChange={(e) => set("offer", e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="nx-add-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "🔍 Find Clients"}
                  </button>
                </form>
              </div>

              {loading && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">🔍</div>
                  <p>Searching for businesses... (may take 10–25 seconds)</p>
                </div>
              )}

              {!loading && leads.length > 0 && (
                <>
                  {/* coverage summary */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 14,
                      fontSize: 13,
                      color: "var(--text-sub)",
                    }}
                  >
                    <b>{cover.total} businesses found.</b> Contacts available:{" "}
                    📞 {cover.phone}/{cover.total} · ✉️ {cover.email}/
                    {cover.total} · 🌐 {cover.website}/{cover.total} · 🔗 social{" "}
                    {cover.social}/{cover.total}
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Free data (OpenStreetMap) often lacks contact details. Use
                      the "Find manually" links on each card for missing info.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        Filter results:
                      </span>
                      <button
                        type="button"
                        style={quickBtn(quick.email)}
                        onClick={() =>
                          setQuick((q) => ({ ...q, email: !q.email }))
                        }
                      >
                        ✉️ Has email
                      </button>
                      <button
                        type="button"
                        style={quickBtn(quick.social)}
                        onClick={() =>
                          setQuick((q) => ({ ...q, social: !q.social }))
                        }
                      >
                        🔗 Has social
                      </button>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-sub)",
                          cursor: "pointer",
                        }}
                        onClick={() => selectable.length && toggleAll()}
                      >
                        <Check
                          checked={allOn}
                          disabled={!selectable.length}
                          onChange={toggleAll}
                          label="Select all"
                        />
                        Select all
                      </div>
                      <button
                        className="nx-add-btn"
                        type="button"
                        onClick={saveProspects}
                        disabled={!picked.length || saving}
                      >
                        {saving
                          ? "Saving..."
                          : `⭐ Save prospects (${picked.length})`}
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: "9px 16px",
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          border: "1px solid rgba(255,255,255,0.15)",
                          background: "rgba(255,255,255,0.06)",
                          color: "var(--text-sub)",
                        }}
                        onClick={() =>
                          exportToCSV(
                            visible,
                            `clients-${lastSearch.city || "search"}-${lastSearch.category || ""}.csv`
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          )
                        }
                      >
                        ⬇️ Export CSV
                      </button>
                    </div>
                  </div>

                  {visible.length === 0 && (
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        padding: "16px 0",
                      }}
                    >
                      No businesses match this filter. Try removing the filter.
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {visible.map((lead, i) => (
                      <div
                        key={lead.placeId || i}
                        className="nx-deal-card"
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 16,
                        }}
                      >
                        <div style={{ marginTop: 14 }}>
                          <Check
                            checked={picked.includes(lead.placeId)}
                            disabled={lead.alreadySaved}
                            onChange={() => toggle(lead.placeId)}
                            label={`Select ${lead.name}`}
                          />
                        </div>
                        <ScoreBadge value={lead.aiScore} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="nx-deal-title">
                            {lead.name}
                            {lead.alreadySaved && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 11,
                                  color: "#51cf66",
                                  fontWeight: 500,
                                }}
                              >
                                ✓ Saved
                              </span>
                            )}
                          </div>
                          <div className="nx-deal-stage">{lead.address}</div>
                          {lead.aiReason && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                fontStyle: "italic",
                                marginTop: 4,
                              }}
                            >
                              {lead.aiReason}
                            </div>
                          )}
                          <Contacts p={lead} city={lastSearch.city} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 16,
                      lineHeight: 1.6,
                    }}
                  >
                    Score = number of contact methods found. Data ©
                    OpenStreetMap contributors · Powered by{" "}
                    <a
                      href="https://www.geoapify.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                    >
                      Geoapify
                    </a>
                    . Please verify details before calling or emailing.
                  </p>
                </>
              )}

              {!loading && searched && leads.length === 0 && !error && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">🏙️</div>
                  <h2>No results found</h2>
                  <p>Try expanding the search area or changing the city</p>
                </div>
              )}

              {!searched && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">🎯</div>
                  <h2>Find your potential clients</h2>
                  <p>
                    Select a country, city, and business type. Each result will
                    show which contact details were found and which are missing.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ================= SAVED ================= */}
          {tab === "saved" && (
            <>
              {savedLoading && (
                <div className="nx-empty-state">
                  <p>Loading...</p>
                </div>
              )}

              {!savedLoading && prospects.length === 0 && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">⭐</div>
                  <h2>No saved prospects yet</h2>
                  <p>
                    Go to the Find tab, search for businesses, and click "Save
                    prospects"
                  </p>
                </div>
              )}

              {!savedLoading && prospects.length > 0 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: 4,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        padding: "9px 16px",
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--text-sub)",
                      }}
                      onClick={() =>
                        exportToCSV(prospects, "saved-prospects.csv")
                      }
                    >
                      ⬇️ Export CSV ({prospects.length})
                    </button>
                  </div>
                  {prospects.map((p) => (
                    <div
                      key={p._id}
                      className="nx-deal-card"
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 16,
                      }}
                    >
                      <ScoreBadge value={p.score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nx-deal-title">{p.name}</div>
                        <div className="nx-deal-stage">{p.address}</div>
                        {(p.category || p.city) && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginTop: 4,
                            }}
                          >
                            Search:{" "}
                            {[p.category, p.city].filter(Boolean).join(" · ")}
                          </div>
                        )}
                        <Contacts p={p} city={p.city} />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        <button
                          className="nx-add-btn"
                          type="button"
                          disabled={busyId === p._id}
                          onClick={() => convert(p)}
                        >
                          {busyId === p._id ? "..." : "→ Convert to Lead"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p._id}
                          onClick={() => removeProspect(p)}
                          style={{
                            background: "none",
                            border: 0,
                            color: "#ff8a8a",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
