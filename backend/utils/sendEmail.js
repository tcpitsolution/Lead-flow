const emailjs = require("@emailjs/nodejs");

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const emailjsAuth = () => ({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// EmailJS ke error mein asli wajah err.text mein hoti hai
const wrapError = (err) =>
  new Error(err.text || err.message || "EmailJS send failed");

// ---------------------------------------------------------------
// OTP mail
// ---------------------------------------------------------------
const sendOtpEmail = async (to, name, code, purpose) => {
  const minutes = process.env.OTP_EXPIRES_MIN || 10;
  const title =
    purpose === "signup"
      ? "Verify your email"
      : purpose === "email-change"
        ? "Verify your email change"
        : "Verify your login";

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_OTP_TEMPLATE_ID,
      {
        to_email: to,
        to_name: name,
        otp_code: code,
        title,
        minutes,
        subject: `${code} - LeadFlow ${title}`,
      },
      emailjsAuth(),
    );
  } catch (err) {
    throw wrapError(err);
  }
};

// ---------------------------------------------------------------
// Lead reminder mail
// ---------------------------------------------------------------
const MAX_SHOWN = 15;

const rowStyle =
  "padding:13px 0;border-bottom:1px solid #E3E7EE;" +
  "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" +
  "font-size:15px;color:#14213D;";

const sendLeadReminderEmail = async (toEmail, name, leads) => {
  const shown = leads.slice(0, MAX_SHOWN);
  const extra = leads.length - shown.length;

  let leadList = shown
    .map((l) => `<tr><td style="${rowStyle}">${escapeHtml(l.name)}</td></tr>`)
    .join("");

  if (extra > 0) {
    leadList += `<tr><td style="${rowStyle}color:#0B7A75;font-weight:600;">+ ${extra} more leads in your dashboard</td></tr>`;
  }

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,
        to_name: name,
        lead_count: leads.length,
        lead_list: leadList,
        dashboard_url: "https://leadflowcrm.site",
      },
      emailjsAuth(),
    );
  } catch (err) {
    throw wrapError(err);
  }
};

module.exports = { sendOtpEmail, sendLeadReminderEmail };