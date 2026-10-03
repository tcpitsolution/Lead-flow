import { useState } from "react";
import { Link } from "react-router-dom";
import "./PublicPage.css";
import SEO from "../../components/SEO";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const { name, email, message } = form;
    if (!name || !email || !message) return;
    window.location.href = `mailto:solutiontcp@gmail.com?subject=LeadFlow Enquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`;
    setSent(true);
  };

  return (
    <div className="pub-page">
      <SEO
        title="Contact Us - Get in Touch with the LeadFlow Team"
        description="Have a question about LeadFlow CRM? Contact our team for support, sales enquiries, or partnership opportunities. We're happy to help."
        canonical="/contact"
      />

      <section className="pub-hero">
        <span className="pub-tag">Contact</span>
        <h1 className="pub-hero-title">
          Get in touch with<br />
          <span className="pub-accent">our team</span>
        </h1>
        <p className="pub-hero-sub">
          Questions about pricing, features, or your account? We're here to help.
        </p>
      </section>

      <section className="pub-section">
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h2 style={{ color: "var(--accent)" }}>Message sent!</h2>
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
                We'll get back to you at <strong>{form.email}</strong> shortly.
              </p>
              <Link to="/" className="pub-btn-primary" style={{ display: "inline-block", marginTop: 24 }}>
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label htmlFor="contact-name" style={{ display: "block", marginBottom: 6, color: "var(--text)" }}>
                  Full Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  value={form.name}
                  onChange={change}
                  placeholder="Your name"
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 15 }}
                />
              </div>
              <div>
                <label htmlFor="contact-email" style={{ display: "block", marginBottom: 6, color: "var(--text)" }}>
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  placeholder="you@company.com"
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 15 }}
                />
              </div>
              <div>
                <label htmlFor="contact-message" style={{ display: "block", marginBottom: 6, color: "var(--text)" }}>
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={change}
                  placeholder="How can we help you?"
                  required
                  rows={5}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 15, resize: "vertical" }}
                />
              </div>
              <button type="submit" className="pub-btn-primary" style={{ alignSelf: "flex-start" }}>
                Send message
              </button>
            </form>
          )}

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Or email us directly at{" "}
              <a href="mailto:solutiontcp@gmail.com" style={{ color: "var(--accent)" }}>
                solutiontcp@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
