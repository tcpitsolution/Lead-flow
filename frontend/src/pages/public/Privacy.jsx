import { Link } from "react-router-dom";
import "./PublicPage.css";

export default function Privacy() {
  return (
    <div className="pub-page">
      <div className="pub-hero">
        <span className="pub-tag">LEGAL</span>
        <h1 className="pub-hero-title">Privacy <span className="pub-accent">Policy</span></h1>
        <p className="pub-hero-sub">Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>

      <div className="pub-section" style={{ maxWidth: 760 }}>
        <div className="legal-body">

          <h2>1. Information We Collect</h2>
          <p>When you register and use LeadFlow CRM, we collect:</p>
          <ul>
            <li>Account information: name, email address, phone number.</li>
            <li>Lead data: information you enter about your leads and contacts.</li>
            <li>Usage data: pages visited, features used, and session activity.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and maintain the Service.</li>
            <li>Send OTP verification and reminder emails.</li>
            <li>Improve features and user experience.</li>
            <li>Respond to support requests.</li>
          </ul>

          <h2>3. Data Storage</h2>
          <p>Your data is stored securely on our servers. We take reasonable technical and organizational measures to protect it from unauthorized access, loss, or misuse.</p>

          <h2>4. Data Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share data with service providers (e.g., email delivery) strictly to operate the Service.</p>

          <h2>5. Cookies</h2>
          <p>We use minimal cookies and local storage to keep you logged in and remember your preferences. No third-party tracking cookies are used.</p>

          <h2>6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:leadflowcrm.support@gmail.com">leadflowcrm.support@gmail.com</a>.</p>

          <h2>7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or an in-app notice.</p>

          <h2>8. Contact</h2>
          <p>For privacy-related queries, reach us at <a href="mailto:leadflowcrm.support@gmail.com">leadflowcrm.support@gmail.com</a>.</p>
        </div>

        <div style={{ marginTop: 40 }}>
          <Link to="/" className="pub-btn-secondary">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
