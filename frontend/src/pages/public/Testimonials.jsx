import { Link } from "react-router-dom";
import "./PublicPage.css";
import SEO from "../../components/SEO";

const TESTIMONIALS = [
  {
    name: "Rahul Sharma",
    role: "Digital Marketing Agency Owner",
    location: "Mumbai, India",
    avatar: "RS",
    rating: 5,
    text: "LeadFlow's Client Finder is a game changer. I searched 'marketing agency' in Pune and got 20 businesses with phone numbers and Instagram handles in under 30 seconds. Saved me 3 hours of manual research every single day.",
  },
  {
    name: "Priya Mehta",
    role: "Freelance Web Designer",
    location: "Bangalore, India",
    avatar: "PM",
    rating: 5,
    text: "I used to maintain leads in a messy Excel sheet. LeadFlow replaced that completely. The pipeline view, follow-up reminders, and the fact that it's free to start — I recommended it to every freelancer I know.",
  },
  {
    name: "Arjun Nair",
    role: "Sales Manager, SaaS Startup",
    location: "Hyderabad, India",
    avatar: "AN",
    rating: 5,
    text: "The AI scoring feature is surprisingly accurate. When I enter our service offer, it ranks leads by relevance. Our team's conversion rate went up 40% in the first month because we stopped wasting time on cold leads.",
  },
  {
    name: "Sneha Kapoor",
    role: "Insurance Advisor",
    location: "Delhi, India",
    avatar: "SK",
    rating: 5,
    text: "I find new clients every morning using Client Finder. I search for businesses in my area, save the ones that look promising, and convert them to leads. The whole workflow takes 10 minutes and fills my pipeline for the week.",
  },
  {
    name: "Mohammed Al-Rashid",
    role: "Real Estate Consultant",
    location: "Dubai, UAE",
    avatar: "MR",
    rating: 5,
    text: "LeadFlow works perfectly for the UAE market too. I search for businesses in Dubai and Abu Dhabi, get their contact details, and track every conversation. The CSV export is great for sharing with my team.",
  },
  {
    name: "Kavya Reddy",
    role: "SEO Consultant",
    location: "Chennai, India",
    avatar: "KR",
    rating: 5,
    text: "The contact enrichment is what sold me. LeadFlow automatically finds emails and social profiles from business websites. I don't have to manually visit each site anymore. It's like having a research assistant.",
  },
  {
    name: "Vikram Singh",
    role: "Business Development, IT Firm",
    location: "Pune, India",
    avatar: "VS",
    rating: 5,
    text: "We tried 3 other CRMs before LeadFlow. They were either too expensive or too complicated. LeadFlow is clean, fast, and has everything we actually use. The Client Finder alone is worth 10x the Pro plan price.",
  },
  {
    name: "Ananya Joshi",
    role: "Salon Chain Owner",
    location: "Ahmedabad, India",
    avatar: "AJ",
    rating: 5,
    text: "I use LeadFlow to track B2B clients for our salon products. The follow-up reminders are a lifesaver — I never forget to call back a prospect. My close rate has improved significantly since I started using it.",
  },
  {
    name: "Ravi Kumar",
    role: "Logistics Startup Founder",
    location: "Kolkata, India",
    avatar: "RK",
    rating: 5,
    text: "Finding businesses that need courier services used to take days. Now I search 'logistics' or 'factory' in any city and get a ready list. LeadFlow paid for itself in the first week.",
  },
];

const STATS = [
  { value: "2,000+", label: "Sales teams" },
  { value: "10k+", label: "Leads tracked" },
  { value: "98%", label: "Satisfaction rate" },
  { value: "3x", label: "Faster deal closing" },
];

export default function TestimonialsPage() {
  return (
    <div className="pub-page">
      <SEO
        title="Customer Reviews - What Sales Teams Say About LeadFlow"
        description="Read real reviews from freelancers, agency owners, and sales managers using LeadFlow CRM. See how teams are closing more deals with lead management software."
        canonical="/testimonials"
      />
      {/* Hero */}
      <section className="pub-hero">
        <span className="pub-tag">Testimonials</span>
        <h1 className="pub-hero-title">
          Loved by sales teams<br />
          <span className="pub-accent">across the world</span>
        </h1>
        <p className="pub-hero-sub">
          From freelancers to agency owners — here's what real LeadFlow users have to say.
        </p>
      </section>

      {/* Stats */}
      <section className="pub-section" style={{ paddingTop: 0 }}>
        <div className="pub-stats-row">
          {STATS.map((s) => (
            <div key={s.label} className="pub-stat-box">
              <div className="pub-stat-value">{s.value}</div>
              <div className="pub-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="pub-section pub-section-alt">
        <div className="pub-section-header">
          <h2 className="pub-section-title">What our users say</h2>
          <p className="pub-section-sub">Real reviews from real customers — no filters.</p>
        </div>
        <div className="pub-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="pub-testimonial-card">
              <div className="pub-testimonial-stars">
                {"★".repeat(t.rating)}
              </div>
              <p className="pub-testimonial-text">"{t.text}"</p>
              <div className="pub-testimonial-author">
                <div className="pub-testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="pub-testimonial-name">{t.name}</div>
                  <div className="pub-testimonial-role">{t.role} · {t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pub-cta-band">
        <h2>Join 2,000+ teams growing with LeadFlow</h2>
        <p>Start for free. No credit card required.</p>
        <Link to="/signup" className="pub-btn-primary">Get started free</Link>
      </section>
    </div>
  );
}
