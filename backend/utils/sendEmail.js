const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const sendOtpEmail = async (to, name, code, purpose) => {
  const apiKey = process.env.RESEND_API_KEY;

  // key nahi hai: development mein OTP console mein print hoga
  if (!apiKey) {
    if (process.env.NODE_ENV === "production")
      throw new Error("RESEND_API_KEY is not configured");
    console.log(`\n[DEV] ${purpose} OTP for ${to}: ${code}\n`);
    return;
  }

  const minutes = process.env.OTP_EXPIRES_MIN || 10;
  const title =
    purpose === "signup"
      ? "Verify your email"
      : purpose === "email-change"
        ? "Verify your email change"
        : "Verify your login";
  const safeName = escapeHtml(name);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [to],
      subject: `${code} - LeadFlow ${title}`,
      text: `Hi ${name}, your LeadFlow OTP is ${code}. It is valid for ${minutes} minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
          <h2 style="margin:0 0 8px">LeadFlow</h2>
          <p>Hi ${safeName}, enter this code to ${title.toLowerCase()}:</p>
          <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:20px 0">${code}</p>
          <p style="color:#666">This code is valid for ${minutes} minutes. Do not share it with anyone.</p>
        </div>`,
    }),
    signal: AbortSignal.timeout(10000), // 10 sec mein jawab nahi aaya to fail
  });

  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
};

module.exports = { sendOtpEmail };
