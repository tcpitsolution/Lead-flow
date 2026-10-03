const crypto = require("crypto");
const Otp = require("../models/Otp");

const EXPIRY_MIN = Number(process.env.OTP_EXPIRES_MIN) || 10;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

const hash = (email, purpose, code) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${email}:${purpose}:${code}`)
    .digest("hex");

// creates a new OTP and returns the code (email must be sent separately)
const createOtp = async (email, purpose) => {
  const existing = await Otp.findOne({ email, purpose });
  if (existing) {
    const waited = (Date.now() - existing.lastSentAt.getTime()) / 1000;
    if (waited < RESEND_SECONDS) {
      const err = new Error(
        `Please wait ${Math.ceil(RESEND_SECONDS - waited)} seconds before trying again`,
      );
      err.status = 429;
      throw err;
    }
  }

  const code = String(crypto.randomInt(100000, 1000000));
  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      codeHash: hash(email, purpose, code),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + EXPIRY_MIN * 60 * 1000),
    },
    { upsert: true },
  );
  return code;
};

const checkOtp = async (email, purpose, code) => {
  const rec = await Otp.findOne({ email, purpose });
  if (!rec || rec.expiresAt < new Date()) {
    return {
      ok: false,
      message: "OTP has expired or not found, please request a new one",
    };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    await rec.deleteOne();
    return { ok: false, message: "Too many incorrect attempts, please request a new OTP" };
  }

  const given = Buffer.from(hash(email, purpose, code));
  const real = Buffer.from(rec.codeHash);
  const match =
    given.length === real.length && crypto.timingSafeEqual(given, real);

  if (!match) {
    rec.attempts += 1;
    await rec.save();
    return {
      ok: false,
      message: `Incorrect OTP (${MAX_ATTEMPTS - rec.attempts} attempts remaining)`,
    };
  }

  await rec.deleteOne(); // each OTP is single-use
  return { ok: true };
};

module.exports = { createOtp, checkOtp };

