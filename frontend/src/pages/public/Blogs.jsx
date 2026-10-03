import { useState } from "react";
import { Link } from "react-router-dom";
import "./PublicPage.css";
import SEO from "../../components/SEO";

const BLOGS = [
  {
    slug: "client-finder-guide",
    tag: "Product",
    date: "June 12, 2025",
    readTime: "5 min read",
    title: "How to Find 100 Potential Clients in Any City in Under 10 Minutes",
    excerpt:
      "LeadFlow's Client Finder uses OpenStreetMap and Geoapify to surface real businesses with contact details. Here's a step-by-step guide to finding, saving, and converting prospects faster than ever.",
    author: "LeadFlow Team",
    authorInitial: "LF",
  },
  {
    slug: "lead-scoring-explained",
    tag: "Sales Tips",
    date: "June 5, 2025",
    readTime: "4 min read",
    title: "What is Lead Scoring and Why Your Sales Team Needs It",
    excerpt:
      "Not all leads are equal. Lead scoring helps you focus on the prospects most likely to convert. We explain how LeadFlow's AI scoring works and how to use it to prioritize your outreach.",
    author: "Rahul Sharma",
    authorInitial: "RS",
  },
  {
    slug: "crm-for-freelancers",
    tag: "Guide",
    date: "May 28, 2025",
    readTime: "6 min read",
    title: "Why Every Freelancer Needs a CRM (And How to Start for Free)",
    excerpt:
      "Most freelancers track clients in WhatsApp chats or Excel sheets. That's a recipe for missed follow-ups and lost deals. Here's why a simple CRM like LeadFlow changes everything.",
    author: "Priya Mehta",
    authorInitial: "PM",
  },
  {
    slug: "follow-up-strategy",
    tag: "Sales Tips",
    date: "May 20, 2025",
    readTime: "5 min read",
    title: "The 5-Touch Follow-up Strategy That Closes More Deals",
    excerpt:
      "80% of sales require at least 5 follow-ups, but 44% of salespeople give up after just one. We break down a proven follow-up sequence and show you how to automate it with LeadFlow.",
    author: "LeadFlow Team",
    authorInitial: "LF",
  },
  {
    slug: "pipeline-analytics",
    tag: "Product",
    date: "May 12, 2025",
    readTime: "4 min read",
    title: "Understanding Your Sales Pipeline: A Beginner's Guide to Analytics",
    excerpt:
      "Your pipeline is more than a list of deals. It's a data source. Learn how to read conversion rates, identify bottlenecks, and use LeadFlow's analytics to make smarter sales decisions.",
    author: "Arjun Nair",
    authorInitial: "AN",
  },
  {
    slug: "b2b-outreach-india",
    tag: "Strategy",
    date: "May 3, 2025",
    readTime: "7 min read",
    title: "B2B Outreach in India: What Works in 2025",
    excerpt:
      "Cold calling, WhatsApp, email, LinkedIn — the Indian B2B market has its own rules. We surveyed 200+ sales professionals to find out which outreach channels are delivering the best results right now.",
    author: "LeadFlow Team",
    authorInitial: "LF",
  },
];

const TAGS = ["All", "Product", "Sales Tips", "Guide", "Strategy"];

export default function BlogsPage() {
  const [activeTag, setActiveTag] = useState("All");

  const filtered =
    activeTag === "All" ? BLOGS : BLOGS.filter((b) => b.tag === activeTag);

  return (
    <div className="pub-page">
      <SEO
        title="Blog - Sales Tips, CRM Guides & Product Updates"
        description="Read LeadFlow's blog for sales tips, lead management guides, CRM strategies, and product updates. Learn how to find more clients and close more deals."
        canonical="/blogs"
      />
      {/* Hero */}
      <section className="pub-hero">
        <span className="pub-tag">Blog</span>
        <h1 className="pub-hero-title">
          Sales insights &<br />
          <span className="pub-accent">product updates</span>
        </h1>
        <p className="pub-hero-sub">
          Tips, strategies, and guides to help you find more clients, close more
          deals, and get the most out of LeadFlow.
        </p>
      </section>

      {/* Tag filters */}
      <section className="pub-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="pub-blog-tags">
          {TAGS.map((t) => (
            <button
              key={t}
              className={`pub-blog-tag-btn${activeTag === t ? " active" : ""}`}
              onClick={() => setActiveTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Blog grid */}
      <section className="pub-section">
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text)", textAlign: "center", padding: "40px 0" }}>
            No posts in this category yet.
          </p>
        ) : (
          <div className="pub-blog-grid">
            {filtered.map((b) => (
              <article key={b.slug} className="pub-blog-card">
                <div className="pub-blog-card-top">
                  <span className="pub-blog-tag-pill">{b.tag}</span>
                  <span className="pub-blog-meta">{b.date} · {b.readTime}</span>
                </div>
                <h2 className="pub-blog-title">{b.title}</h2>
                <p className="pub-blog-excerpt">{b.excerpt}</p>
                <div className="pub-blog-footer">
                  <div className="pub-blog-author">
                    <div className="pub-blog-avatar">{b.authorInitial}</div>
                    <span>{b.author}</span>
                  </div>
                  <Link to={`/blogs/${b.slug}`} className="pub-blog-read-more">
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="pub-cta-band">
        <h2>Ready to grow your pipeline?</h2>
        <p>Start for free — no credit card required.</p>
        <Link to="/signup" className="pub-btn-primary">Get started free</Link>
      </section>
    </div>
  );
}
