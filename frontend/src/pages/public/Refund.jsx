import { Link } from "react-router-dom";
import "./PublicPage.css";

export default function Refund() {
  return (
    <div className="pub-page">
      <div className="pub-hero">
        <span className="pub-tag">LEGAL</span>
        <h1 className="pub-hero-title">Refund &amp; <span className="pub-accent">Cancellation</span></h1>
        <p className="pub-hero-sub">Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>

      <div className="pub-section" style={{ maxWidth: 760 }}>
        <div className="legal-body">

          <h2>1. Subscription Plans</h2>
          <p>LeadFlow CRM offers paid subscription plans as listed on the Pricing page. Payments are made via UPI and activated manually by our admin team after verification.</p>

          <h2>2. Refund Policy</h2>
          <p>We offer a <strong>7-day refund window</strong> from the date of payment activation. If you are not satisfied with the Service, you may request a full refund within this period.</p>
          <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
          <ul>
            <li>Refund request made after 7 days of activation.</li>
            <li>Account suspended due to violation of Terms &amp; Conditions.</li>
            <li>Partial use of the subscription period beyond 7 days.</li>
          </ul>

          <h2>3. How to Request a Refund</h2>
          <p>To request a refund, email us at <a href="mailto:leadflowcrm.support@gmail.com">leadflowcrm.support@gmail.com</a> with:</p>
          <ul>
            <li>Your registered email address.</li>
            <li>UTR / transaction number of your payment.</li>
            <li>Reason for the refund request.</li>
          </ul>
          <p>We will process approved refunds within <strong>5–7 business days</strong> to the original payment method.</p>

          <h2>4. Cancellation</h2>
          <p>You may cancel your subscription at any time from your account settings. Cancellation stops future renewals but does not entitle you to a refund for the current billing period unless within the 7-day window.</p>

          <h2>5. Plan Downgrades</h2>
          <p>If you downgrade your plan, the change takes effect at the end of your current billing cycle. No partial refunds are issued for downgrades.</p>

          <h2>6. Contact</h2>
          <p>For any refund or cancellation queries, contact us at <a href="mailto:leadflowcrm.support@gmail.com">leadflowcrm.support@gmail.com</a>.</p>
        </div>

        <div style={{ marginTop: 40 }}>
          <Link to="/" className="pub-btn-secondary">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
