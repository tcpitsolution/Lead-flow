import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import AppToast from "../AppToast";
import LeadCard from "./LeadCard";
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

function exportToCSV(rows, filename) {
  const cols = [
    "Name",
    "Address",
    "Phone",
    "Email",
    "Website",
    "Website Status",
    "Website Issues",
    "Opportunity Summary",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Score",
    "Category",
    "City",
    "Maps URL",
  ];

  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const lines = [
    cols.join(","),
    ...rows.map((p) =>
      [
        p.name,
        p.address,
        p.phone,
        p.emails?.[0] ?? p.email ?? "",
        p.website,
        p.websiteStatus ?? "",
        (p.websiteIssues || []).join(" | "),
        p.problem_summary ?? "",
        p.instagram,
        p.facebook,
        p.linkedin,
        p.aiScore ?? p.score ?? "",
        p.category ?? "",
        p.city ?? "",
        p.mapsUrl ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
   THEME-AWARE STYLES
   Colours come from CSS variables (--cf-*) defined in Dashboard.css,
   so they switch automatically between light and dark theme.
───────────────────────────────────────────── */

const selectStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  fontSize: 14,
  background: "var(--cf-field-bg)",
  border: "1.5px solid var(--cf-field-border)",
  color: "var(--text)",
  colorScheme: "var(--cf-scheme)",
};

const fieldLabel = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "var(--text-label)",
  marginBottom: 7,
};

const inputStyle = {
  ...selectStyle,
  outline: "none",
  boxSizing: "border-box",
};

const LEAD_TYPE_HINTS = {
  all: "Every business found, each with its own website status and issues.",
  no_website: "Only businesses with no website listed on Google Maps.",
  has_website: "Only businesses that have a website, with its audit results.",
};

function Field({ icon, label, children, hint, span }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : undefined, minWidth: 0 }}>
      <div style={fieldLabel}>
        <span>{icon}</span>
        {label}
      </div>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

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
          : "1.5px solid var(--cf-check-border)",
        background: checked
          ? "linear-gradient(135deg,#4da3ff,#7b8cff)"
          : "var(--cf-field-bg)",
      }}
    >
      {checked ? "✓" : ""}
    </button>
  );
}

const tabBtn = (active) => ({
  padding: "9px 18px",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  border: active ? "1px solid transparent" : "1px solid var(--cf-btn-border)",
  background: active
    ? "linear-gradient(135deg,#4da3ff,#7b8cff)"
    : "var(--cf-btn-bg)",
  color: active ? "#fff" : "var(--text-sub)",
});

const quickBtn = (on) => ({
  padding: "6px 12px",
  borderRadius: 99,
  fontSize: 12,
  cursor: "pointer",
  border: on
    ? "1px solid rgba(77,163,255,0.5)"
    : "1px solid var(--cf-btn-border)",
  background: on ? "rgba(77,163,255,0.2)" : "var(--cf-btn-bg)",
  color: on ? "var(--cf-quick-on)" : "var(--text-sub)",
});

const exportBtnStyle = {
  padding: "9px 16px",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  border: "1px solid var(--cf-btn-border)",
  background: "var(--cf-btn-bg)",
  color: "var(--text-sub)",
};

/* ─────────────────────────────────────────────
   SEARCH POPUP (self-contained: no external CSS needed)
   Rendered in document.body, so it always covers the whole screen.
───────────────────────────────────────────── */
function SearchingPopup() {
  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Searching businesses"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "var(--cf-overlay, rgba(10,14,39,0.5))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        cursor: "wait",
      }}
    >
      <style>{`
        @keyframes cfSpin { to { transform: rotate(360deg); } }
        @keyframes cfOrbit {
          from { transform: rotate(0deg) translateX(11px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(11px) rotate(-360deg); }
        }
        @keyframes cfPop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          padding: "34px 28px 30px",
          borderRadius: 20,
          background: "var(--cf-modal-bg, var(--bg-sidebar, #fff))",
          border: "1px solid var(--cf-card-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          animation: "cfPop 0.25s ease",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 84,
            height: 84,
            margin: "0 auto 18px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "3px solid rgba(116,143,252,0.2)",
              borderTopColor: "#4dabf7",
              animation: "cfSpin 1.2s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: 30,
                lineHeight: 1,
                animation: "cfOrbit 1.8s linear infinite",
              }}
            >
              🔍
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          Searching and auditing...
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-muted)",
          }}
        >
          Finding businesses and checking their websites. This can take 30-60
          seconds, please keep this page open.
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ClientFinder() {
  const [tab, setTab] = useState("find");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    country: "in",
    city: "",
    catChoice: "Dentist",
    customCat: "",
    radius: 8000,
    limit: 10,

    // all | no_website | has_website
    leadType: "all",

    offer: "",
  });

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const category =
    form.catChoice === "__other" ? form.customCat.trim() : form.catChoice;

  const [lastSearch, setLastSearch] = useState({
    category: "",
    city: "",
    country: "in",
    offer: "",
  });

  const [leads, setLeads] = useState([]);
  const [picked, setPicked] = useState([]);
  const [quick, setQuick] = useState({ email: false, social: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);

  const [prospects, setProspects] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [busyId, setBusyId] = useState("");

  const visible = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (!quick.email || lead.emails?.length) &&
          (!quick.social || lead.instagram || lead.facebook || lead.linkedin),
      ),
    [leads, quick],
  );

  const selectable = visible.filter((lead) => !lead.alreadySaved);

  const allOn =
    selectable.length > 0 &&
    selectable.every((lead) => picked.includes(lead.placeId));

  const cover = useMemo(
    () => ({
      total: leads.length,
      phone: leads.filter((lead) => lead.phone).length,
      email: leads.filter((lead) => lead.emails?.length).length,
      website: leads.filter((lead) => lead.website).length,
      social: leads.filter(
        (lead) => lead.instagram || lead.facebook || lead.linkedin,
      ).length,
    }),
    [leads],
  );

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setError("");
    setNotice("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (category.length < 2) {
      setError("Please select or enter a business type");
      return;
    }

    if (form.city.trim().length < 2) {
      setError("Please enter a city name");
      return;
    }

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

          leadType: form.leadType,
        },
      });

      setLastSearch({
        category,
        city: form.city.trim(),
        country: form.country,
        offer: form.offer.trim(),
      });

      setLeads(data.leads || []);

      if (!data.leads?.length) {
        setError(
          "No matching businesses found. Try a different city, category, or lead type.",
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleAll = () => {
    const ids = selectable.map((lead) => lead.placeId);

    setPicked((current) =>
      allOn
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])],
    );
  };

  const saveProspects = async () => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const chosen = leads.filter((lead) => picked.includes(lead.placeId));

      const data = await api("/finder/save", {
        method: "POST",
        body: {
          items: chosen,
          category: lastSearch.category,
          city: lastSearch.city,
        },
      });

      setLeads((current) =>
        current.map((lead) =>
          picked.includes(lead.placeId)
            ? { ...lead, alreadySaved: true }
            : lead,
        ),
      );

      setPicked([]);

      setNotice(
        `${data.added} prospect(s) saved${
          data.skipped ? `, ${data.skipped} already existed` : ""
        }. Go to the "Saved Prospects" tab to convert them to leads.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lock page scroll while the search popup is open
  useEffect(() => {
    if (!loading) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [loading]);

  useEffect(() => {
    if (tab !== "saved") return undefined;

    let alive = true;
    setSavedLoading(true);

    api("/finder/prospects?status=saved")
      .then((data) => {
        if (alive) setProspects(data.prospects || []);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setSavedLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tab]);

  const convert = async (prospect) => {
    setBusyId(prospect._id);
    setError("");
    setNotice("");

    try {
      await api(`/finder/prospects/${prospect._id}/convert`, {
        method: "POST",
      });

      setProspects((current) =>
        current.filter((item) => item._id !== prospect._id),
      );

      setNotice(`"${prospect.name}" has been added to your Leads list.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const removeProspect = async (prospect) => {
    if (!window.confirm(`Remove "${prospect.name}"?`)) return;

    setBusyId(prospect._id);
    setError("");
    setNotice("");

    try {
      await api(`/finder/prospects/${prospect._id}`, {
        method: "DELETE",
      });

      setProspects((current) =>
        current.filter((item) => item._id !== prospect._id),
      );
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
                Find website opportunities, audit them, and convert the best
                prospects into leads.
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

          <AppToast message={error} type="error" onClose={() => setError("")} />
          <AppToast
            message={notice}
            type="success"
            onClose={() => setNotice("")}
          />

          {tab === "find" && (
            <>
              <div
                style={{
                  marginBottom: 24,
                  padding: 22,
                  borderRadius: 18,
                  background: "var(--cf-card-bg)",
                  border: "1px solid var(--cf-card-border)",
                  boxShadow: "var(--cf-card-shadow)",
                }}
              >
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    🔎 Find businesses
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginTop: 3,
                    }}
                  >
                    Search Google Maps, audit each website, and get
                    ready-to-send outreach.
                  </div>
                </div>

                <form onSubmit={handleSearch}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(230px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <Field icon="🌍" label="Country">
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
                    </Field>

                    <Field icon="📍" label="City">
                      <input
                        style={inputStyle}
                        placeholder="e.g. Ludhiana, Mumbai, Dubai"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        required
                      />
                    </Field>

                    <Field icon="🏢" label="Business type">
                      <select
                        style={selectStyle}
                        value={form.catChoice}
                        onChange={(e) => set("catChoice", e.target.value)}
                      >
                        {CATEGORIES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}

                        <option value="__other">
                          Other (type your own)...
                        </option>
                      </select>
                    </Field>

                    {form.catChoice === "__other" && (
                      <Field icon="✏️" label="Your business type" span>
                        <input
                          style={inputStyle}
                          placeholder="e.g. Yoga studio, Bank, Courier"
                          value={form.customCat}
                          onChange={(e) => set("customCat", e.target.value)}
                        />
                      </Field>
                    )}

                    <Field
                      icon="🎯"
                      label="Lead type"
                      hint={LEAD_TYPE_HINTS[form.leadType]}
                    >
                      <select
                        style={selectStyle}
                        value={form.leadType}
                        onChange={(e) => set("leadType", e.target.value)}
                      >
                        <option value="all">All opportunities</option>
                        <option value="no_website">No website only</option>
                        <option value="has_website">Has website</option>
                      </select>
                    </Field>

                    <Field
                      icon="🔢"
                      label="Number of results"
                      hint={
                        Number(form.limit) >= 50
                          ? "Bigger searches take longer and use more search credits."
                          : "10 or 20 is best for quick, accurate results."
                      }
                    >
                      <select
                        style={selectStyle}
                        value={form.limit}
                        onChange={(e) => set("limit", e.target.value)}
                      >
                        <option value={10}>10 results</option>
                        <option value={20}>20 results</option>
                        <option value={50}>50 results (30-60 sec)</option>
                        <option value={100}>100 results (1-2 min)</option>
                      </select>
                    </Field>

                    <Field
                      icon="💼"
                      label="Your service / offer (optional)"
                      hint="Used in the suggested outreach message."
                    >
                      <input
                        style={inputStyle}
                        placeholder="e.g. Website design, SEO, Digital marketing"
                        value={form.offer}
                        onChange={(e) => set("offer", e.target.value)}
                      />
                    </Field>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                      marginTop: 20,
                    }}
                  >
                    <button
                      className="nx-add-btn"
                      type="submit"
                      disabled={loading}
                      style={{ padding: "12px 28px", fontSize: 14 }}
                    >
                      {loading
                        ? "Searching and auditing..."
                        : "🔍 Find Clients"}
                    </button>

                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Results come from Google Maps. Always verify details
                      before outreach.
                    </span>
                  </div>
                </form>
              </div>

              {loading && <SearchingPopup />}

              {!loading && leads.length > 0 && (
                <>
                  <div
                    style={{
                      background: "var(--cf-summary-bg)",
                      border: "1px solid var(--cf-summary-border)",
                      boxShadow: "var(--cf-card-shadow)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 14,
                      fontSize: 13,
                      color: "var(--text-sub)",
                    }}
                  >
                    <b>{cover.total} opportunities found.</b> Contacts
                    available: 📞 {cover.phone}/{cover.total} · ✉️ {cover.email}
                    /{cover.total} · 🌐 {cover.website}/{cover.total} · 🔗
                    social {cover.social}/{cover.total}
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 5,
                      }}
                    >
                      Results match your selected lead type, sorted by
                      opportunity score.
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 8,
                      marginBottom: 12,
                    }}
                  >
                    Open "Suggested message" on a card to see a ready-to-send
                    outreach message based on the issues found.
                  </p>

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
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        Filter results:
                      </span>

                      <button
                        type="button"
                        style={quickBtn(quick.email)}
                        onClick={() =>
                          setQuick((current) => ({
                            ...current,
                            email: !current.email,
                          }))
                        }
                      >
                        ✉️ Has email
                      </button>

                      <button
                        type="button"
                        style={quickBtn(quick.social)}
                        onClick={() =>
                          setQuick((current) => ({
                            ...current,
                            social: !current.social,
                          }))
                        }
                      >
                        🔗 Has social
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--text-sub)",
                          cursor: selectable.length ? "pointer" : "not-allowed",
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
                        style={exportBtnStyle}
                        onClick={() =>
                          exportToCSV(
                            visible,
                            `clients-${lastSearch.city || "search"}-${
                              lastSearch.category || ""
                            }`
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/-+$/, ""),
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
                      No businesses match the quick filter. Remove "Has email"
                      or "Has social" to view all search results.
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {visible.map((lead, index) => (
                      <LeadCard
                        key={lead.placeId || index}
                        lead={lead}
                        city={lastSearch.city}
                        country={lastSearch.country}
                        offer={lastSearch.offer}
                        checked={picked.includes(lead.placeId)}
                        onToggle={() => toggle(lead.placeId)}
                        disableCheck={Boolean(lead.alreadySaved)}
                        savedMark={Boolean(lead.alreadySaved)}
                      />
                    ))}
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 16,
                      lineHeight: 1.6,
                    }}
                  >
                    Opportunity score considers website need, detected website
                    issues, and available contact methods. Always verify contact
                    details and audit findings before outreach.
                  </p>
                </>
              )}

              {!loading && searched && leads.length === 0 && !error && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">🏙️</div>
                  <h2>No opportunities found</h2>
                  <p>Try a different city, category, or lead type.</p>
                </div>
              )}

              {!searched && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">🎯</div>
                  <h2>Find website opportunities</h2>
                  <p>
                    Search a category and city. LeadFlow will identify
                    businesses without websites or with website improvement
                    opportunities.
                  </p>
                </div>
              )}
            </>
          )}

          {tab === "saved" && (
            <>
              {savedLoading && (
                <div className="nx-empty-state">
                  <p>Loading saved prospects...</p>
                </div>
              )}

              {!savedLoading && prospects.length === 0 && (
                <div className="nx-empty-state">
                  <div className="nx-empty-icon">⭐</div>
                  <h2>No saved prospects yet</h2>
                  <p>
                    Search for website opportunities and save the prospects you
                    want to contact.
                  </p>
                </div>
              )}

              {!savedLoading && prospects.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
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
                      style={exportBtnStyle}
                      onClick={() =>
                        exportToCSV(prospects, "saved-prospects.csv")
                      }
                    >
                      ⬇️ Export CSV ({prospects.length})
                    </button>
                  </div>

                  {prospects.map((prospect) => (
                    <LeadCard
                      key={prospect._id}
                      lead={prospect}
                      city={prospect.city}
                      country={lastSearch.country || form.country}
                      offer={lastSearch.offer || form.offer}
                      actions={
                        <>
                          <button
                            className="nx-add-btn"
                            type="button"
                            disabled={busyId === prospect._id}
                            onClick={() => convert(prospect)}
                          >
                            {busyId === prospect._id
                              ? "..."
                              : "→ Convert to Lead"}
                          </button>

                          <button
                            type="button"
                            disabled={busyId === prospect._id}
                            onClick={() => removeProspect(prospect)}
                            style={{
                              background: "none",
                              border: 0,
                              color: "var(--cf-danger)",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Remove
                          </button>
                        </>
                      }
                    />
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
