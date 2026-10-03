const nodemailer = require("nodemailer");

let transporter;
const getTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const sendOtpEmail = async (to, name, code, purpose) => {
  const t = getTransporter();

  if (!t) {
    if (process.env.NODE_ENV === "production")
      throw new Error("SMTP is not configured");
    console.log(`\n[DEV] ${purpose} OTP for ${to}: ${code}\n`);
    return;
  }

  const minutes = process.env.OTP_EXPIRES_MIN || 10;
  const title =
    purpose === "signup" ? "Verify your email" :
    purpose === "email-change" ? "Verify your email change" :
    "Verify your login";

  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `${code} - LeadFlow ${title}`,
    text: `Hi ${name}, your LeadFlow OTP is ${code}. It is valid for ${minutes} minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
        <h2 style="margin:0 0 8px">LeadFlow</h2>
        <p>Hi ${name}, enter this code to ${title.toLowerCase()}:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:20px 0">${code}</p>
        <p style="color:#666">This code is valid for ${minutes} minutes. Do not share it with anyone.</p>
      </div>`,
  });
};

module.exports = { sendOtpEmail };
