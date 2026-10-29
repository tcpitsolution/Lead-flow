const nodemailer = require("nodemailer");
const emailjs = require("@emailjs/nodejs");

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// ---------------------------------------------------------------
// OTP mail (pehle jaisa hi, koi badlav nahi)
// ---------------------------------------------------------------
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendOtpEmail = async (to, name, code, purpose) => {
  const minutes = process.env.OTP_EXPIRES_MIN || 10;
  const title =
    purpose === "signup"
      ? "Verify your email"
      : purpose === "email-change"
        ? "Verify your email change"
        : "Verify your login";
  const safeName = escapeHtml(name);

  await createTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `${code} - LeadFlow ${title}`,
    text: `Hi ${name}, your LeadFlow OTP is ${code}. It is valid for ${minutes} minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
        <h2 style="margin:0 0 8px">LeadFlow</h2>
        <p>Hi ${safeName}, enter this code to ${title.toLowerCase()}:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:20px 0">${code}</p>
        <p style="color:#666">This code is valid for ${minutes} minutes. Do not share it with anyone.</p>
      </div>`,
  });
};

// ---------------------------------------------------------------
// Lead reminder mail (EmailJS se)
// ---------------------------------------------------------------
const MAX_SHOWN = 15; // mail mein zyada se zyada itni leads dikhengi

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
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      },
    );
  } catch (err) {
    // EmailJS ke error mein asli wajah err.text mein hoti hai
    throw new Error(err.text || err.message || "EmailJS send failed");
  }
};

module.exports = { sendOtpEmail, sendLeadReminderEmail };
