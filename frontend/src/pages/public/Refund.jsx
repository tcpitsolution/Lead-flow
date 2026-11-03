import { useEffect } from "react";
import { Link } from "react-router-dom";

const BRAND = "Leadflowcrm";
const EMAIL = "leadflowcrm.support@gmail.com";
const UPDATED = "November 4, 2026";

const sections = [
  {
    h: "1. Free Trial",
    p: [
      `${BRAND} gives every new user a free 14-day trial so you can try the service before paying.`,
    ],
  },
  {
    h: "2. Refund Window",
    p: ["Refund requests must be made within 7 days of the payment."],
  },
  {
    h: "3. When You Are Eligible for a Refund",
    p: [
      "Payment cancelled or failed: if your payment was cancelled, failed with an error, or the amount was deducted but the order did not complete, the amount is refunded to you.",
      "Duplicate payment: if you were charged more than once for the same plan, the extra amount is refunded.",
      "Plan not activated: if your payment succeeded but your plan was not activated due to a technical issue and we cannot fix it, we will refund the amount.",
    ],
  },
  {
    h: "4. Refund Timeline",
    p: [
      "Approved refunds are returned to your original payment method within 5 to 7 working days. Failed or cancelled payments are usually returned automatically by your bank or payment provider within the same period. The exact time can vary with your bank.",
    ],
  },
  {
    h: "5. If You Do Not Receive Your Money",
    p: [
      `If the amount has not reached you after 7 working days, email us at ${EMAIL} with your registered email address and the payment ID or a screenshot of the payment, and we will look into it.`,
    ],
  },
  {
    h: "6. Cancellation",
    p: [
      "You can stop using the service at any time. Your plan stays active until the end of the period you paid for. We do not charge you again automatically; you pay only when you choose to buy a plan.",
    ],
  },
  {
    h: "7. Contact",
    p: [`For any refund or cancellation question, write to ${EMAIL}.`],
  },
];

export default function Refund() {
  useEffect(() => {
    document.title = `Refund & Cancellation Policy | ${BRAND}`;
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
      <h1 style={{ marginTop: 16 }}>Refund & Cancellation Policy</h1>
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
