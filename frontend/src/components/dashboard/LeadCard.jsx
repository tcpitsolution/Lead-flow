import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const num = (v) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
};

const mapLink = (p) =>
  p.mapsUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    p.address || p.name || "",
  )}`;

const googleFor = (p, city, extra) =>
  `https://www.google.com/search?q=${encodeURIComponent(
    [p.name, city, extra].filter(Boolean).join(" "),
  )}`;

function toWhatsAppNumber(phone, country = "in") {
  if (!phone) return "";

  let digits = String(phone).replace(/\D/g, "");

  if (country === "in" && digits.length === 10) digits = `91${digits}`;
  if (digits.length < 10 || digits.length > 15) return "";

  return digits;
}

function getWhatsAppUrl(phone, country, message = "") {
  const number = toWhatsAppNumber(phone, country);
  if (!number) return "";

  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/* ------------------------------------------------------------------ */
/*  Insight: ek lead ke liye alag message (sirf asli audit data se)    */
/* ------------------------------------------------------------------ */

export function getInsight(lead = {}) {
  const status =
    lead.websiteStatus || (lead.website ? "basic_ok" : "no_website");

  // 1) Website nahi hai
  if (!lead.website || status === "no_website") {
    return {
      key: "no_website",
      label: "No website",
      extra: 0,
      tone: "opportunity",
      headline: "No website found",
      message:
        "This business has no website listed on its Google Maps profile. A direct opportunity to build one.",
      notes: [
        "No official website listed on Google Maps",
        "Customers cannot browse services or send online enquiries",
      ],
    };
  }

  // 2) Sirf social / listing page
  if (status === "social_only") {
    return {
      key: "social_only",
      label: "Social page only",
      extra: 0,
      tone: "opportunity",
      headline: "No official website",
      message:
        "The business relies on a social or listing page instead of its own website.",
      notes: ["Uses a social or listing page instead of an official website"],
    };
  }

  // 3) Website khul nahi rahi
  if (status === "broken") {
    return {
      key: "broken",
      label: "Website not opening",
      extra: 0,
      tone: "error",
      headline: "Website could not be reached",
      message:
        "The website did not load during the check. Verify the URL before contacting the business.",
      notes: ["Website did not load during the automated check"],
    };
  }

  // 4) Website hai: asli audit data se problems nikalo
  const ps = lead.pageSpeed || {};
  const perf = num(ps.performance);
  const seo = num(ps.seo);
  const acc = num(ps.accessibility);

  const issues = (lead.websiteIssues || [])
    .map((i) => (typeof i === "string" ? i : i?.message || i?.title || ""))
    .filter(Boolean);

  const used = new Set();
  const found = [];

  const add = (key, label, note, regex) => {
    const hits = regex
      ? issues
          .map((t, idx) => (regex.test(t) ? idx : -1))
          .filter((idx) => idx >= 0)
      : [];

    hits.forEach((idx) => used.add(idx));
    return { key, label, note, hits };
  };

  const rules = [
    add(
      "not_mobile",
      "Not mobile friendly",
      "Website is not mobile friendly",
      /mobile|viewport|responsive|tap target|small screen/i,
    ),
    add(
      "outdated",
      "Outdated website",
      "Website looks outdated",
      /outdated|\bold\b|legacy|deprecated|flash|jquery|table layout|copyright|©/i,
    ),
    add(
      "theme",
      "Theme / design issues",
      "Theme or design issues (layout, fonts or images look off)",
      /theme|template|design|layout|contrast|font|broken image|alignment/i,
    ),
    add(
      "slow",
      "Slow loading",
      "Website loads slowly",
      /slow|speed|load time|lcp/i,
    ),
    add(
      "https",
      "Not secure",
      "Website is not secure (no HTTPS)",
      /ssl|https|certificate|insecure/i,
    ),
    add(
      "seo",
      "Weak SEO",
      "SEO is weak, hard to find on Google",
      /seo|meta description|title tag|heading|alt text/i,
    ),
  ];

  for (const r of rules) {
    if (r.hits.length) found.push({ key: r.key, label: r.label, note: r.note });
  }

  // PageSpeed ke asli numbers (issue text na bhi ho tab bhi)
  if (perf != null && perf < 70) {
    const note = `Slow on mobile (speed score ${perf}/100)`;
    const slow = found.find((f) => f.key === "slow");
    if (slow) slow.note = note;
    else found.push({ key: "slow", label: "Slow loading", note });
  }

  if (seo != null && seo < 70) {
    const note = `Weak SEO (score ${seo}/100)`;
    const s = found.find((f) => f.key === "seo");
    if (s) s.note = note;
    else found.push({ key: "seo", label: "Weak SEO", note });
  }

  if (acc != null && acc < 60) {
    found.push({
      key: "access",
      label: "Accessibility issues",
      note: `Accessibility issues (score ${acc}/100)`,
    });
  }

  const notes = found.map((f) => f.note);

  // Jo issues kisi category mein nahi aaye wo bhi dikhao
  issues.forEach((t, idx) => {
    if (!used.has(idx)) notes.push(t);
  });

  if (notes.length) {
    const first = found[0];

    return {
      key: first?.key || "needs_improvement",
      label: first?.label || "Needs improvement",
      extra: Math.max(found.length - 1, 0),
      tone: "warning",
      headline: `${notes.length} website issue${notes.length > 1 ? "s" : ""} found`,
      message:
        "The website has problems that a redesign or fix could solve. Use them in your pitch.",
      notes: notes.slice(0, 6),
    };
  }

  if (status === "needs_redesign" || status === "needs_improvement") {
    return {
      key: "needs_improvement",
      label: "Needs improvement",
      extra: 0,
      tone: "warning",
      headline: "Website needs improvement",
      message: "The automated audit flagged this website for improvement.",
      notes: ["Automated audit flagged this website for improvement"],
    };
  }

  // 5) Sab theek
  return {
    key: "looks_good",
    label: "Website looks good",
    extra: 0,
    tone: "good",
    headline: "No major problems found",
    message:
      "The automated checks found no major problems. A lower-priority lead for website work.",
    notes: [],
  };
}

const TONES = {
  opportunity: {
    bg: "rgba(81,207,102,0.10)",
    border: "rgba(81,207,102,0.28)",
    color: "#69db7c",
    icon: "🎯",
  },
  warning: {
    bg: "rgba(255,169,77,0.10)",
    border: "rgba(255,169,77,0.28)",
    color: "#ffa94d",
    icon: "⚠️",
  },
  error: {
    bg: "rgba(255,107,107,0.10)",
    border: "rgba(255,107,107,0.28)",
    color: "#ff8787",
    icon: "⛔",
  },
  good: {
    bg: "rgba(116,192,252,0.10)",
    border: "rgba(116,192,252,0.28)",
    color: "#74c0fc",
    icon: "✅",
  },
};

/* ------------------------------------------------------------------ */
/*  Suggested message (insight ke hisaab se alag)                      */
/* ------------------------------------------------------------------ */

function buildOutreachMessage(lead, offer, insight) {
  const business = lead.name || "there";

  let observation;

  if (insight.key === "no_website") {
    observation =
      "I noticed that your business does not currently have an official website.";
  } else if (insight.key === "social_only") {
    observation =
      "I noticed that your business depends mainly on social or listing pages instead of an official website.";
  } else if (insight.key === "broken") {
    observation =
      "I noticed that your website appears to be unavailable or not loading properly.";
  } else if (insight.tone === "warning" && insight.notes.length) {
    observation = `I noticed a few website improvement opportunities: ${insight.notes
      .slice(0, 3)
      .join("; ")}.`;
  } else {
    observation =
      "I noticed an opportunity to improve your website and enquiry flow.";
  }

  const service =
    offer?.trim() ||
    "a fast, mobile-friendly website with a WhatsApp enquiry system";

  return `Hi ${business} team,

I checked your online presence and ${observation}

We help businesses get more enquiries with ${service}.

Would you like a free 2-minute website audit?`;
}

/* ------------------------------------------------------------------ */
/*  Small UI pieces                                                    */
/* ------------------------------------------------------------------ */

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 16,
  padding: 18,
};

const tileStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "11px 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

const smallLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

function Checkbox({ checked, disabled, onChange, label }) {
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

function Tile({ icon, label, value, href, color = "#74c0fc" }) {
  const has = Boolean(value);

  const body = (
    <div style={tileStyle}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          fontSize: 15,
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={smallLabel}>{label}</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginTop: 2,
            color: has ? color : "var(--text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {has ? value : "Not found"}
        </div>
      </div>
    </div>
  );

  return has && href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", minWidth: 0 }}
    >
      {body}
    </a>
  ) : (
    <div style={{ minWidth: 0 }}>{body}</div>
  );
}

function ActionBtn({ href, icon, label, bg, color, border }) {
  const base = {
    flex: "1 1 120px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
  };

  if (!href) {
    return (
      <span
        style={{
          ...base,
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-muted)",
          border: "1px solid rgba(255,255,255,0.06)",
          opacity: 0.6,
          cursor: "not-allowed",
        }}
      >
        {icon} {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      style={{
        ...base,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {icon} {label}
    </a>
  );
}

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: "#ffd43b", letterSpacing: 2, fontSize: 15 }}>
      {"★".repeat(full)}
      <span style={{ color: "rgba(255,255,255,0.2)" }}>
        {"★".repeat(Math.max(5 - full, 0))}
      </span>
    </span>
  );
}

function ScoreCircle({ value }) {
  const v = num(value);

  const bg =
    v == null
      ? "rgba(255,255,255,0.1)"
      : v >= 70
        ? "linear-gradient(135deg,#51cf66,#2f9e44)"
        : v >= 40
          ? "linear-gradient(135deg,#ffd43b,#e67700)"
          : "linear-gradient(135deg,#ff6b6b,#e03131)";

  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 14,
          color: "#fff",
          background: bg,
        }}
      >
        {v ?? "-"}
      </div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
        Score
      </div>
    </div>
  );
}

function PageSpeedRow({ pageSpeed }) {
  const items = [
    ["Speed", pageSpeed?.performance],
    ["SEO", pageSpeed?.seo],
    ["Accessibility", pageSpeed?.accessibility],
    ["Best practices", pageSpeed?.bestPractices],
  ].filter(([, v]) => num(v) != null);

  if (!items.length) return null;

  const color = (v) => (v >= 80 ? "#69db7c" : v >= 50 ? "#ffd43b" : "#ff8787");

  return (
    <div style={{ ...card, padding: "12px 14px", marginTop: 10 }}>
      <div style={{ ...smallLabel, marginBottom: 8 }}>
        Mobile scores (Google PageSpeed)
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map(([label, value]) => (
          <span
            key={label}
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: color(Number(value)),
            }}
          >
            {label} {Number(value)}/100
          </span>
        ))}
      </div>
    </div>
  );
}

function MessageBox({ message, email }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const pill = (on) => ({
    padding: "6px 14px",
    borderRadius: 99,
    fontSize: 12,
    cursor: "pointer",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: on ? "rgba(77,163,255,0.2)" : "transparent",
    color: on ? "#7fb8ff" : "var(--text-sub)",
  });

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={pill(open)}
      >
        ✉️ {open ? "Hide message" : "Suggested message"}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          <textarea
            readOnly
            value={message}
            rows={8}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.5,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text, #e8eaff)",
              resize: "vertical",
            }}
          />

          <div
            style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}
          >
            <button type="button" onClick={copy} style={pill(false)}>
              {copied ? "✓ Copied" : "📋 Copy message"}
            </button>

            {email && (
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(
                  "Quick website feedback",
                )}&body=${encodeURIComponent(message)}`}
                style={pill(false)}
              >
                📧 Send by email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main card                                                          */
/* ------------------------------------------------------------------ */

export default function LeadCard({
  lead,
  city = "",
  country = "in",
  offer = "",
  checked = false,
  onToggle = null, // agar null hai toh checkbox nahi dikhega
  disableCheck = false,
  savedMark = false,
  actions = null, // right side buttons (Convert / Remove)
}) {
  const insight = getInsight(lead);
  const tone = TONES[insight.tone] || TONES.good;

  const email = lead.emails?.[0] || lead.email || "";
  const social = lead.instagram || lead.facebook || lead.linkedin || "";
  const socialNames = [
    lead.instagram && "Instagram",
    lead.facebook && "Facebook",
    lead.linkedin && "LinkedIn",
  ].filter(Boolean);

  const message = buildOutreachMessage(lead, offer, insight);
  const waUrl = getWhatsAppUrl(lead.phone, country, message);
  const waNumber = toWhatsAppNumber(lead.phone, country);

  const rating = num(lead.rating);
  const ratingCount = num(lead.ratingCount);
  const score = lead.aiScore ?? lead.lead_score ?? lead.score;

  const cityText = lead.city || city;
  const subtitle = [lead.category, cityText].filter(Boolean).join(" · ");

  const ratingNote =
    rating == null
      ? ""
      : rating >= 4 && insight.tone !== "good"
        ? "Well-rated business, but its online presence can be improved."
        : rating >= 4
          ? "Well-rated business with a decent online presence."
          : "Customers rate this business lower, a better online presence can help.";

  return (
    <div
      style={{ ...card, display: "flex", gap: 14, alignItems: "flex-start" }}
    >
      {onToggle && (
        <div style={{ paddingTop: 6 }}>
          <Checkbox
            checked={checked}
            disabled={disableCheck}
            onChange={onToggle}
            label={`Select ${lead.name}`}
          />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              display: "grid",
              placeItems: "center",
              fontSize: 19,
              flexShrink: 0,
              background: "rgba(124,140,255,0.14)",
            }}
          >
            🏢
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text, #e8eaff)",
              }}
            >
              {lead.name}
              {savedMark && (
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

            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {subtitle ? `${subtitle}` : ""}
              {subtitle && lead.address ? " · " : ""}
              {lead.address ? `📍 ${lead.address}` : ""}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: tone.bg,
                border: `1px solid ${tone.border}`,
                color: tone.color,
                whiteSpace: "nowrap",
              }}
            >
              {insight.label}
              {insight.extra > 0 ? ` +${insight.extra}` : ""}
            </span>

            <ScoreCircle value={score} />
          </div>
        </div>

        {/* Banner */}
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 16 }}>{tone.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tone.color }}>
              {insight.headline}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-sub)",
                marginTop: 2,
                lineHeight: 1.5,
              }}
            >
              {insight.message}
            </div>
          </div>
        </div>

        {/* Info tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 10,
            marginTop: 12,
          }}
        >
          <Tile
            icon="📞"
            label="Phone"
            value={lead.phone}
            href={lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, "")}` : ""}
            color="#69db7c"
          />
          <Tile
            icon="💬"
            label="WhatsApp"
            value={waNumber}
            href={waUrl}
            color="#69db7c"
          />
          <Tile
            icon="✉️"
            label="Email"
            value={email}
            href={email ? `mailto:${email}` : ""}
          />
          <Tile
            icon="🌐"
            label="Website"
            value={lead.website ? host(lead.website) : ""}
            href={lead.website}
          />
          <Tile
            icon="🔗"
            label="Social"
            value={socialNames.join(", ")}
            href={social}
            color="#da77f2"
          />
          <Tile icon="📍" label="City" value={cityText} />
        </div>

        {/* Rating */}
        {rating != null && (
          <div
            style={{
              ...card,
              padding: "12px 14px",
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 26 }}>⭐</div>

            <div>
              <div style={smallLabel}>Google business rating</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>
                  {rating.toFixed(1)}
                </span>
                <Stars rating={rating} />
                {ratingCount != null && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    ({ratingCount} reviews)
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-sub)",
                flex: 1,
                minWidth: 180,
              }}
            >
              {ratingNote}
            </div>
          </div>
        )}

        <PageSpeedRow pageSpeed={lead.pageSpeed} />

        {/* Weakness notes */}
        {insight.notes.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,107,107,0.08)",
              border: "1px solid rgba(255,107,107,0.22)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "#ff8787",
                marginBottom: 8,
              }}
            >
              ⚠ Weakness notes
            </div>

            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.7,
                color: "#ffc9c9",
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,107,107,0.18)",
              }}
            >
              {insight.notes.map((note, i) => (
                <span key={`${note}-${i}`}>
                  {i > 0 && <span style={{ opacity: 0.5 }}> | </span>}
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}
        >
          <ActionBtn
            href={lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, "")}` : ""}
            icon="📞"
            label="Call"
            bg="rgba(81,207,102,0.12)"
            color="#69db7c"
            border="rgba(81,207,102,0.3)"
          />
          <ActionBtn
            href={waUrl}
            icon="💬"
            label="WhatsApp"
            bg="rgba(37,211,102,0.14)"
            color="#69db7c"
            border="rgba(37,211,102,0.32)"
          />
          <ActionBtn
            href={email ? `mailto:${email}` : ""}
            icon="✉️"
            label="Email"
            bg="rgba(77,171,247,0.12)"
            color="#74c0fc"
            border="rgba(77,171,247,0.3)"
          />
          <ActionBtn
            href={lead.instagram}
            icon="📷"
            label="Instagram"
            bg="rgba(218,119,242,0.13)"
            color="#e599f7"
            border="rgba(218,119,242,0.3)"
          />
          <ActionBtn
            href={lead.facebook}
            icon="👍"
            label="Facebook"
            bg="rgba(77,171,247,0.12)"
            color="#74c0fc"
            border="rgba(77,171,247,0.3)"
          />
          <ActionBtn
            href={lead.linkedin}
            icon="💼"
            label="LinkedIn"
            bg="rgba(77,171,247,0.12)"
            color="#74c0fc"
            border="rgba(77,171,247,0.3)"
          />
          <ActionBtn
            href={mapLink(lead)}
            icon="🗺️"
            label="Google Map"
            bg="rgba(255,255,255,0.06)"
            color="#e8eaff"
            border="rgba(255,255,255,0.18)"
          />
        </div>

        {waUrl && (
          <div
            style={{ fontSize: 10, marginTop: 7, color: "var(--text-muted)" }}
          >
            The WhatsApp button opens a pre-filled message. WhatsApp confirms
            whether the number is registered after opening it.
          </div>
        )}

        <MessageBox message={message} email={email} />

        {(!lead.instagram || !lead.facebook || !lead.linkedin || !email) && (
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}
          >
            Quick lookup:{" "}
            <a
              href={googleFor(lead, cityText, "contact phone email")}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4dabf7" }}
            >
              Google
            </a>
            {!lead.instagram && (
              <>
                {" · "}
                <a
                  href={googleFor(lead, cityText, "site:instagram.com")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4dabf7" }}
                >
                  Instagram
                </a>
              </>
            )}
            {!lead.facebook && (
              <>
                {" · "}
                <a
                  href={googleFor(lead, cityText, "site:facebook.com")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4dabf7" }}
                >
                  Facebook
                </a>
              </>
            )}
            {!lead.linkedin && (
              <>
                {" · "}
                <a
                  href={googleFor(lead, cityText, "site:linkedin.com")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4dabf7" }}
                >
                  LinkedIn
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
