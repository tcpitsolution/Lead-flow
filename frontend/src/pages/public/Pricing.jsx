import { Link } from "react-router-dom";
import "./PublicPage.css";
import SEO from "../../components/SEO";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    desc: "Perfect for freelancers and solo sales reps just getting started.",
    cta: "Get started free",
    ctaLink: "/signup",
    highlight: false,
    features: [
      "Up to 50 leads",
      "Client Finder — 10 searches/day",
      "Basic pipeline view",
      "Follow-up reminders",
      "CSV export",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "₹299",
    period: "per month",
    desc: "For growing sales teams that need more power and automation.",
    cta: "Start Pro trial",
    ctaLink: "/signup",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited leads",
      "Client Finder — 100 searches/day",
      "AI lead scoring",
      "Contact enrichment (email + social)",
      "Pipeline analytics & charts",
      "Company grouping",
      "CSV export",
      "Priority email support",
    ],
  },
  {
    name: "Business",
    price: "₹799",
    period: "per month",
    desc: "For agencies and teams managing multiple clients and high volumes.",
    cta: "Contact sales",
    ctaLink: "/contact",
    highlight: false,
    features: [
      "Everything in Pro",
      "Unlimited Client Finder searches",
      "Team members (up to 10)",
      "Role-based access control",
      "Dedicated account manager",
      "Custom integrations",
      "SLA-backed uptime",
      "Phone & chat support",
    ],
  },
];

const FAQS = [
  {
    q: "Is the free plan really free forever?",
    a: "Yes. The Starter plan has no time limit. You can use LeadFlow for free as long as you want with up to 50 leads and 10 Client Finder searches per day.",
  },
  {
    q: "What is Client Finder?",
    a: "Client Finder lets you search any city and business category (dentist, gym, restaurant, etc.) and instantly get a list of businesses with their phone, email, website, Instagram, Facebook, and LinkedIn — ready to save as prospects.",
  },
  {
    q: "How does AI lead scoring work?",
    a: "LeadFlow scores each lead based on how many contact methods are available (phone, email, website, social) and optionally uses Gemini AI to match the lead against your service offer for a relevance score.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. All plans include CSV export. You can export search results or your saved prospects list and open them directly in Excel or Google Sheets.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no long-term contracts. You can cancel your Pro or Business subscription at any time and your data remains accessible.",
  },
  {
    q: "Do you offer a discount for annual billing?",
    a: "Yes — annual billing saves you 2 months (effectively 17% off). Contact us at hello@leadflow.com to switch to annual.",
  },
];

export default function PricingPage() {
  return (
    <div className="pub-page">
      <SEO
        title="Pricing - Free CRM Plan & Affordable Sales Tools"
        description="LeadFlow offers a free forever plan plus affordable Pro and Business plans. Start managing leads at no cost. No hidden fees, no long-term contracts."
        canonical="/pricing"
      />
      {/* Hero */}
      <section className="pub-hero">
        <span className="pub-tag">Pricing</span>
        <h1 className="pub-hero-title">
          Simple, transparent<br />
          <span className="pub-accent">pricing for every team</span>
        </h1>
        <p className="pub-hero-sub">
          Start free. Upgrade when you need more. No hidden fees, no surprises.
        </p>
      </section>

      {/* Plans */}
      <section className="pub-section">
        <div className="pub-pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`pub-pricing-card${plan.highlight ? " pub-pricing-highlight" : ""}`}>
              {plan.badge && <div className="pub-pricing-badge">{plan.badge}</div>}
              <div className="pub-pricing-name">{plan.name}</div>
              <div className="pub-pricing-price">
                {plan.price}
                {plan.price !== "Free" && <span className="pub-pricing-period"> / {plan.period}</span>}
              </div>
              {plan.price === "Free" && <div className="pub-pricing-period-free">forever</div>}
              <p className="pub-pricing-desc">{plan.desc}</p>
              <Link
                to={plan.ctaLink}
                className={plan.highlight ? "pub-btn-primary" : "pub-btn-secondary"}
                style={{ display: "block", textAlign: "center", marginBottom: 28 }}
              >
                {plan.cta}
              </Link>
              <ul className="pub-pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="pub-check">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pub-section pub-section-alt">
        <div className="pub-section-header">
          <span className="pub-tag">FAQ</span>
          <h2 className="pub-section-title">Frequently asked questions</h2>
        </div>
        <div className="pub-faq-grid">
          {FAQS.map((faq) => (
            <div key={faq.q} className="pub-faq-card">
              <h3 className="pub-faq-q">{faq.q}</h3>
              <p className="pub-faq-a">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pub-cta-band">
        <h2>Still have questions?</h2>
        <p>Talk to our team — we're happy to help you pick the right plan.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/signup" className="pub-btn-primary">Start for free</Link>
          <Link to="/contact" className="pub-btn-secondary">Contact us</Link>
        </div>
      </section>
    </div>
  );
}
