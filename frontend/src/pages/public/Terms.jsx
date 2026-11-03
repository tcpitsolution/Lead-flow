import { Link } from "react-router-dom";
import "./PublicPage.css";

export default function Terms() {
  return (
    <div className="pub-page">
      <div className="pub-hero">
        <span className="pub-tag">LEGAL</span>
        <h1 className="pub-hero-title">Terms &amp; <span className="pub-accent">Conditions</span></h1>
        <p className="pub-hero-sub">Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>

      <div className="pub-section" style={{ maxWidth: 760 }}>
        <div className="legal-body">

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using LeadFlow CRM ("Service"), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the Service.</p>

          <h2>2. Use of Service</h2>
          <p>LeadFlow CRM is a lead management and CRM platform. You agree to use it only for lawful purposes and in accordance with these terms. You must not:</p>
          <ul>
            <li>Use the Service to store or transmit unlawful, harmful, or fraudulent data.</li>
            <li>Attempt to gain unauthorized access to any part of the Service.</li>
            <li>Reverse-engineer, copy, or redistribute any part of the platform.</li>
          </ul>

          <h2>3. Account Responsibility</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. All activities that occur under your account are your responsibility.</p>

          <h2>4. Subscription &amp; Payments</h2>
          <p>Paid plans are billed as described on the Pricing page. Payments are processed manually via UPI. Access is activated after admin verification of your payment.</p>

          <h2>5. Intellectual Property</h2>
          <p>All content, design, and code within LeadFlow CRM is the intellectual property of LeadFlow. You may not copy or use it without written permission.</p>

          <h2>6. Termination</h2>
          <p>We reserve the right to suspend or terminate your account if you violate these terms, without prior notice.</p>

          <h2>7. Limitation of Liability</h2>
          <p>LeadFlow CRM is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

          <h2>8. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

          <h2>9. Contact</h2>
          <p>For any questions regarding these terms, contact us at <a href="mailto:leadflowcrm.support@gmail.com">leadflowcrm.support@gmail.com</a>.</p>
        </div>

        <div style={{ marginTop: 40 }}>
          <Link to="/" className="pub-btn-secondary">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
