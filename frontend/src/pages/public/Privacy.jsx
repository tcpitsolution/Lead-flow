import { useEffect } from "react";
import { Link } from "react-router-dom";

const BRAND = "Leadflowcrm";
const EMAIL = "leadflowcrm.support@gmail.com";
const SITE = "https://crm.site";
const UPDATED = "November 4, 2026";

const sections = [
  {
    h: "1. Introduction",
    p: [
      `This Privacy Policy explains what information ${BRAND} collects, how we use it and how we protect it when you use ${SITE}.`,
    ],
  },
  {
    h: "2. Information We Collect",
    p: [
      "Account information: your name, email address, phone number, account type (freelancer or company/agency owner) and password. Your password is stored in protected (hashed) form.",
      "Verification data: one-time passwords (OTPs) sent to your email at sign-up and login.",
      "Content you add: leads and their details (such as name, company name, LinkedIn, Instagram), notes, reminders and your lead search queries.",
      "Technical data: such as IP address, browser type and basic usage information, used to keep the service secure and working.",
      "Payment information: payments are handled by Razorpay. We do not receive or store your card, UPI or bank details. We only receive confirmation details such as payment ID, amount and status.",
    ],
  },
  {
    h: "3. How We Use Your Information",
    p: [
      "To create and secure your account, verify you by OTP, provide the CRM, lead search and AI features, send daily reminders and service emails (such as OTPs, trial and plan notices), process payments, provide support, and prevent misuse.",
    ],
  },
  {
    h: "4. Service Providers and AI",
    p: [
      "We use trusted third-party service providers to run the service, including cloud hosting, database storage, payment processing, email delivery and AI and business-information services.",
      "When you use AI features such as the client finder, the search details needed to produce results (for example, your search query and location) may be processed by our AI and data providers.",
      "These providers process information only as needed to provide their services and under their own privacy terms.",
    ],
  },
  {
    h: "5. Sharing of Information",
    p: [
      "We do not sell your personal information. We share it only with the service providers described above, or when required by law or to protect our rights and users.",
    ],
  },
  {
    h: "6. Cookies and Local Storage",
    p: [
      "We use browser storage (such as local storage or cookies) to keep you logged in and remember basic preferences.",
    ],
  },
  {
    h: "7. Data Security",
    p: [
      "We use reasonable safeguards such as encrypted connections, hashed passwords and OTP verification. However, no online service can be guaranteed to be completely secure.",
    ],
  },
  {
    h: "8. Data Retention",
    p: [
      "We keep your information while your account is active. If you ask us to delete your account or data, we will remove it within a reasonable time, except for records we must keep by law (such as payment records).",
    ],
  },
  {
    h: "9. Your Rights",
    p: [
      `You can ask to access, correct or delete your personal data at any time by emailing ${EMAIL}.`,
    ],
  },
  {
    h: "10. Information About Your Leads",
    p: [
      "The lead details you add belong to you. You are responsible for making sure you are allowed to store and use them.",
    ],
  },
  {
    h: "11. Children",
    p: [
      "The service is meant for business users and is not intended for children under 18.",
    ],
  },
  {
    h: "12. Changes to This Policy",
    p: [
      "We may update this policy from time to time. The date at the top shows the latest version.",
    ],
  },
  {
    h: "13. Contact",
    p: [`For privacy questions, email ${EMAIL}.`],
  },
];

export default function Privacy() {
  useEffect(() => {
    document.title = `Privacy Policy | ${BRAND}`;
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
      <h1 style={{ marginTop: 16 }}>Privacy Policy</h1>
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
