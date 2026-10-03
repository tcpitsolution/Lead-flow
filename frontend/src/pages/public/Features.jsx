import { Link } from "react-router-dom";
import "./PublicPage.css";
import SEO from "../../components/SEO";

const FEATURES = [
  {
    icon: "🎯",
    title: "Smart Lead Scoring",
    desc: "AI-powered scoring ranks every lead by engagement, profile fit, and behavior so your team always knows who to call first.",
  },
  {
    icon: "🔍",
    title: "Client Finder",
    desc: "Search any city and business type to discover thousands of potential clients with phone, email, website, and social links — all in one click.",
  },
  {
    icon: "📊",
    title: "Pipeline Analytics",
    desc: "Real-time charts show your conversion rates, deal values, and stage-by-stage breakdown so you can spot bottlenecks instantly.",
  },
  {
    icon: "📅",
    title: "Follow-up Reminders",
    desc: "Set follow-up dates on any lead. Get overdue alerts and a daily task list so no opportunity ever slips through the cracks.",
  },
  {
    icon: "🏢",
    title: "Company View",
    desc: "Group all leads by company, see total pipeline value per account, and track every deal stage across an entire organization.",
  },
  {
    icon: "⭐",
    title: "Saved Prospects",
    desc: "Save discovered businesses as prospects, review them at your own pace, and convert the best ones to leads with a single click.",
  },
  {
    icon: "📧",
    title: "Contact Enrichment",
    desc: "LeadFlow automatically scrapes websites for emails, Instagram, Facebook, and LinkedIn handles — saving hours of manual research.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "Every account is isolated. JWT-based auth, OTP email verification, and encrypted storage keep your data safe at all times.",
  },
  {
    icon: "📤",
    title: "CSV Export",
    desc: "Export any search result or saved prospect list to CSV in one click. Open in Excel, Google Sheets, or import into any other tool.",
  },
];

const HOW = [
  { step: "01", title: "Find Clients", desc: "Use Client Finder to search businesses by city and category. Get phone, email, and social data instantly." },
  { step: "02", title: "Save & Score", desc: "Save the best prospects. AI scores each one based on available contact data and your service offer." },
  { step: "03", title: "Convert to Leads", desc: "One click converts a prospect into a tracked lead inside your pipeline with full contact history." },
  { step: "04", title: "Close the Deal", desc: "Follow up on time, move leads through stages, and watch your pipeline analytics grow." },
];

export default function FeaturesPage() {
  return (
    <div className="pub-page">
      <SEO
        title="Features - Lead Management, AI Scoring & Sales Pipeline Tools"
        description="Explore LeadFlow's features: AI lead scoring, Client Finder, pipeline analytics, follow-up reminders, contact enrichment, and CSV export. Everything your sales team needs."
        canonical="/features"
      />
      {/* Hero */}
      <section className="pub-hero">
        <span className="pub-tag">Features</span>
        <h1 className="pub-hero-title">
          Everything you need to<br />
          <span className="pub-accent">close more deals</span>
        </h1>
        <p className="pub-hero-sub">
          LeadFlow combines lead discovery, contact enrichment, pipeline tracking,
          and AI scoring into one clean dashboard built for modern sales teams.
        </p>
        <div className="pub-hero-cta">
          <Link to="/signup" className="pub-btn-primary">Start for free</Link>
          <Link to="/pricing" className="pub-btn-secondary">View pricing</Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="pub-section">
        <div className="pub-section-header">
          <h2 className="pub-section-title">A complete sales toolkit</h2>
          <p className="pub-section-sub">From first discovery to closed deal — every tool you need in one place.</p>
        </div>
        <div className="pub-grid-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="pub-card">
              <span className="pub-card-icon">{f.icon}</span>
              <h3 className="pub-card-title">{f.title}</h3>
              <p className="pub-card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="pub-section pub-section-alt">
        <div className="pub-section-header">
          <span className="pub-tag">How it works</span>
          <h2 className="pub-section-title">From zero to closed deal in 4 steps</h2>
        </div>
        <div className="pub-grid-4">
          {HOW.map((h) => (
            <div key={h.step} className="pub-step-card">
              <div className="pub-step-num">{h.step}</div>
              <h3 className="pub-step-title">{h.title}</h3>
              <p className="pub-step-desc">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pub-cta-band">
        <h2>Ready to find your next client?</h2>
        <p>Join 2,000+ sales teams already using LeadFlow to grow their pipeline.</p>
        <Link to="/signup" className="pub-btn-primary">Get started free</Link>
      </section>
    </div>
  );
}
