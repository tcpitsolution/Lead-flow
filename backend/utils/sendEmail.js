const nodemailer = require("nodemailer");

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

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

const sendLeadReminderEmail = async (to, userName, leads) => {
  const safeUser = escapeHtml(userName);
  const leadListHtml = leads
    .map((l) => `<li style="margin:4px 0">${escapeHtml(l.name || "Unnamed Lead")}</li>`)
    .join("");

  await createTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `⏰ Reminder: Your ${leads.length} lead(s) are waiting - LeadFlow`,
    text: `Hi ${userName}, reminder: your leads are waiting!\n\nTotal Leads: ${leads.length}\n\nLeads:\n${leads.map((l) => `- ${l.name || "Unnamed Lead"}`).join("\n")}\n\nLogin to LeadFlow and follow up now!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="margin:0 0 8px">LeadFlow 🔔</h2>
        <p>Hi ${safeUser},</p>
        <p style="font-size:16px"><strong>Reminder: Your leads are waiting!</strong></p>
        <p>You have <strong>${leads.length} pending lead(s)</strong> that need your attention:</p>
        <ul style="padding-left:20px">${leadListHtml}</ul>
        <p style="margin-top:20px;color:#555">Login to LeadFlow and follow up with your leads now. Don't let them go cold! 🚀</p>
        <a href="${process.env.CLIENT_URL || 'https://leadflowcrm.site'}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Open LeadFlow</a>
      </div>`,
  });
};

module.exports = { sendOtpEmail, sendLeadReminderEmail };
