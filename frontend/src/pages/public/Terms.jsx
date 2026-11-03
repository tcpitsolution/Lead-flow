import { useEffect } from "react";
import { Link } from "react-router-dom";

const BRAND = "Leadflowcrm";
const EMAIL = "leadflowcrm.support@gmail.com";
const SITE = "https://crm.site";
const UPDATED = "November 4, 2026";

const sections = [
  {
    h: "1. About the Service",
    p: [
      `${BRAND} ("we", "us", "our") is an online CRM and lead management platform available at ${SITE}. It lets freelancers and agency owners add and manage leads, receive daily reminders, and search for nearby potential clients using AI-powered tools. By creating an account or using the service, you agree to these Terms.`,
    ],
  },
  {
    h: "2. Account Registration and Verification",
    p: [
      "To sign up you provide your name, email address, phone number, your account type (freelancer or company/agency owner) and a password of at least 8 characters.",
      "Your email is verified with a one-time password (OTP) at sign-up, and a further OTP is sent to your email each time you log in. Both verifications are required to access your account.",
      "You must provide accurate information and keep your login details and OTPs confidential. You are responsible for all activity under your account.",
    ],
  },
  {
    h: "3. Free Trial",
    p: [
      "Every new account gets a free trial of 14 days. After the 14 days end, you must purchase a paid plan to continue using the service.",
    ],
  },
  {
    h: "4. Paid Plans and Access",
    p: [
      "After the trial, access to your saved data and to the AI features depends on having an active paid plan. Prices are shown on our Pricing page and are charged in Indian Rupees (INR).",
      "Payments are processed securely by Razorpay. We do not receive or store your card, UPI or bank details.",
      "We may change prices in the future. Changes apply only to new purchases.",
    ],
  },
  {
    h: "5. Refunds and Cancellation",
    p: [
      "Please read our Refund & Cancellation Policy, which is part of these Terms.",
    ],
  },
  {
    h: "6. Leads, Reminders and Your Content",
    p: [
      "You can add leads (such as name, company name, LinkedIn, Instagram and other contact details) and receive reminders about them. You own the content you add.",
      "You are responsible for having the right to store and use the information you add, and for using it in line with applicable laws, including laws on messaging and marketing.",
    ],
  },
  {
    h: "7. AI Features and Lead Search",
    p: [
      "The service includes AI-powered features, such as a client finder that helps you search for nearby potential clients. These use third-party data and AI providers.",
      "Results may be incomplete, outdated or inaccurate, and we do not guarantee their accuracy or any business result. Please verify information before relying on it.",
    ],
  },
  {
    h: "8. Acceptable Use",
    p: [
      "You agree not to misuse the service, including: sending spam, breaking any law, trying to access other users' data, attacking or overloading our systems, sharing your account with others, or reselling the service without permission.",
    ],
  },
  {
    h: "9. Availability",
    p: [
      "We work to keep the service running smoothly but do not guarantee uninterrupted or error-free access. We may update, change or remove features from time to time.",
    ],
  },
  {
    h: "10. Suspension and Termination",
    p: [
      "We may suspend or close accounts that break these Terms or misuse the service. You may stop using the service at any time.",
    ],
  },
  {
    h: "11. Limitation of Liability",
    p: [
      "To the extent permitted by law, our total liability for any claim related to the service is limited to the amount you paid us in the 3 months before the claim. We are not liable for indirect or consequential losses, including lost business or profits.",
    ],
  },
  {
    h: "12. Governing Law",
    p: [
      "These Terms are governed by the laws of India, and any disputes will be handled by the competent courts in India.",
    ],
  },
  {
    h: "13. Changes to These Terms",
    p: [
      "We may update these Terms. The date at the top shows the latest version. Continuing to use the service means you accept the updated Terms.",
    ],
  },
  {
    h: "14. Contact",
    p: [`For any question about these Terms, email ${EMAIL}.`],
  },
];

export default function Terms() {
  useEffect(() => {
    document.title = `Terms & Conditions | ${BRAND}`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "32px 16px 64px",
        lineHeight: 1.7,
      }}
    >
      <Link to="/">← Back to {BRAND}</Link>
      <h1 style={{ marginTop: 16 }}>Terms & Conditions</h1>
      <p style={{ opacity: 0.7 }}>Last updated: {UPDATED}</p>

      {sections.map((s) => (
        <section key={s.h} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>{s.h}</h2>
          {s.p.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </section>
      ))}

      <p style={{ marginTop: 32 }}>
        Contact: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>
    </div>
  );
}
