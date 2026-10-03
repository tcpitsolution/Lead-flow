const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { getAccess, startTrial } = require("../utils/access");
const { createOtp, checkOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/sendEmail");

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRx = /^[6-9]\d{9}$/;

// accept only strings, reject objects (NoSQL injection protection)
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const normEmail = (v) => clean(v).toLowerCase();
const normPhone = (v) =>
  clean(v)
    .replace(/[\s-]/g, "")
    .replace(/^(\+91|91|0)(?=\d{10}$)/, "");

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  userType: u.userType,
  companyName: u.companyName,
  role: u.role,
  access: getAccess(u),
});

const issueOtp = async (user, purpose) => {
  const code = await createOtp(user.email, purpose);
  try {
    await sendOtpEmail(user.email, user.name, code, purpose);
  } catch (e) {
    console.error("Email error:", e.message);
    await Otp.deleteOne({ email: user.email, purpose });
    const err = new Error(
      "Failed to send email, please try again later",
    );
    err.status = 502;
    throw err;
  }
};

const handleError = (res, error, label) => {
  if (error.status) return fail(res, error.status, error.message);
  if (error.code === 11000)
    return fail(res, 409, "Email or phone number is already registered");
  if (error.name === "ValidationError")
    return fail(res, 400, Object.values(error.errors)[0].message);
  console.error(label, error);
  return fail(res, 500, "Server error, please try again");
};

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const body = req.body || {};
    const name = clean(body.name);
    const email = normEmail(body.email);
    const phone = normPhone(body.phone);
    const userType = clean(body.userType);
    const companyName = clean(body.companyName);
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 60)
      return fail(res, 400, "Name must be between 2 and 60 characters");
    if (!emailRx.test(email)) return fail(res, 400, "Please enter a valid email");
    if (!phoneRx.test(phone))
      return fail(res, 400, "Please enter a valid 10-digit mobile number");
    if (!["freelancer", "company_owner"].includes(userType))
      return fail(res, 400, "Please select Freelancer or Company Owner");
    if (userType === "company_owner" && companyName.length < 2)
      return fail(res, 400, "Please enter your company name");
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    )
      return fail(
        res,
        400,
        "Password must be at least 8 characters with letters and numbers",
      );

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified)
      return fail(res, 409, "An account with this email already exists, please log in");

    const phoneTaken = await User.findOne({ phone, email: { $ne: email } });
    if (phoneTaken)
      return fail(res, 409, "This phone number is linked to another account");

    const data = {
      name,
      phone,
      userType,
      companyName: userType === "company_owner" ? companyName : undefined,
      password,
    };

    let user;
    if (existing) {
      // previously signed up but not verified: update details and resend OTP
      existing.set(data);
      user = await existing.save();
    } else {
      user = await User.create({ ...data, email });
    }

    await issueOtp(user, "signup");
    res
      .status(201)
      .json({
        success: true,
        message: "OTP has been sent to your email",
        email: user.email,
      });
  } catch (error) {
    handleError(res, error, "Signup error:");
  }
};

// POST /api/auth/verify-signup
exports.verifySignup = async (req, res) => {
  try {
    const body = req.body || {};
    const email = normEmail(body.email);
    const otp = clean(String(body.otp ?? ""));

    if (!emailRx.test(email)) return fail(res, 400, "Please enter a valid email");
    if (!/^\d{6}$/.test(otp)) return fail(res, 400, "Please enter a valid 6-digit OTP");

    const user = await User.findOne({ email });
    if (!user) return fail(res, 404, "Account not found, please sign up first");
    if (user.isVerified)
      return fail(res, 409, "Email is already verified, please log in");

    const result = await checkOtp(email, "signup", otp);
    if (!result.ok) return fail(res, 400, result.message);

    user.isVerified = true;
    user.lastSeenAt = user.lastLoginAt;
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    res.json({ success: true, message: "Signup successful! You can now log in" });
  } catch (error) {
    handleError(res, error, "Verify signup error:");
  }
};

// POST /api/auth/login  (step 1: password check, phir OTP)
exports.login = async (req, res) => {
  try {
    const body = req.body || {};
    const email = normEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!emailRx.test(email) || !password)
      return fail(res, 400, "Please enter your email and password");

    const user = await User.findOne({ email }).select("+password");

    // same message for wrong email or password to prevent guessing
    if (!user || !(await user.matchPassword(password)))
      return fail(res, 401, "Incorrect email or password");

    if (!user.isVerified) {
      await issueOtp(user, "signup");
      return fail(res, 403, "Email not verified, a new OTP has been sent", {
        needsVerification: true,
        email: user.email,
      });
    }

    await issueOtp(user, "login");
    res.json({
      success: true,
      message: "Login OTP has been sent to your email",
      email: user.email,
    });
  } catch (error) {
    handleError(res, error, "Login error:");
  }
};

// POST /api/auth/verify-login  (step 2: OTP sahi toh hi token)
exports.verifyLogin = async (req, res) => {
  try {
    const body = req.body || {};
    const email = normEmail(body.email);
    const otp = clean(String(body.otp ?? ""));

    if (!emailRx.test(email)) return fail(res, 400, "Please enter a valid email");
    if (!/^\d{6}$/.test(otp)) return fail(res, 400, "Please enter a valid 6-digit OTP");

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) return fail(res, 401, "Please log in first");

    const result = await checkOtp(email, "login", otp);
    if (!result.ok) return fail(res, 400, result.message);

    res.json({
      success: true,
      message: "Logged in successfully",
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    handleError(res, error, "Verify login error:");
  }
};

// POST /api/auth/resend-otp   body: { email, purpose: "signup" | "login" }
exports.resendOtp = async (req, res) => {
  try {
    const body = req.body || {};
    const email = normEmail(body.email);
    const purpose = clean(body.purpose);

    if (!emailRx.test(email) || !["signup", "login"].includes(purpose))
      return fail(res, 400, "Invalid email or purpose");

    const user = await User.findOne({ email });
    const allowed =
      user && (purpose === "signup" ? !user.isVerified : user.isVerified);
    if (allowed) await issueOtp(user, purpose);

    // don't reveal whether account exists
    res.json({
      success: true,
      message: "If an account exists, a new OTP has been sent",
    });
  } catch (error) {
    handleError(res, error, "Resend OTP error:");
  }
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
};

// PUT /api/auth/profile  (name, phone, companyName)
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    if (body.name !== undefined) {
      const name = clean(body.name);
      if (name.length < 2 || name.length > 60)
        return fail(res, 400, "Name must be between 2 and 60 characters");
      updates.name = name;
    }

    if (body.phone !== undefined) {
      const phone = normPhone(body.phone);
      if (!phoneRx.test(phone))
        return fail(res, 400, "Please enter a valid 10-digit mobile number");
      const taken = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (taken) return fail(res, 409, "This phone number is linked to another account");
      updates.phone = phone;
    }

    if (body.companyName !== undefined) {
      updates.companyName = clean(body.companyName);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    handleError(res, error, "Update profile error:");
  }
};

// POST /api/auth/request-email-change  body: { newEmail }
exports.requestEmailChange = async (req, res) => {
  try {
    const newEmail = normEmail((req.body || {}).newEmail);
    if (!emailRx.test(newEmail)) return fail(res, 400, "Please enter a valid email");
    if (newEmail === req.user.email) return fail(res, 400, "This is already your current email");

    const taken = await User.findOne({ email: newEmail });
    if (taken) return fail(res, 409, "An account with this email already exists");

    // OTP send to the NEW email
    const code = await createOtp(newEmail, "email-change");
    try {
      await sendOtpEmail(newEmail, req.user.name, code, "email-change");
    } catch (e) {
      await Otp.deleteOne({ email: newEmail, purpose: "email-change" });
      return fail(res, 502, "Failed to send OTP email, please try again");
    }

    res.json({ success: true, message: "OTP sent to new email" });
  } catch (error) {
    handleError(res, error, "Request email change error:");
  }
};

// POST /api/auth/verify-email-change  body: { newEmail, otp }
exports.verifyEmailChange = async (req, res) => {
  try {
    const body = req.body || {};
    const newEmail = normEmail(body.newEmail);
    const otp = clean(String(body.otp ?? ""));

    if (!emailRx.test(newEmail)) return fail(res, 400, "Please enter a valid email");
    if (!/^\d{6}$/.test(otp)) return fail(res, 400, "Please enter a valid 6-digit OTP");

    const taken = await User.findOne({ email: newEmail });
    if (taken) return fail(res, 409, "An account with this email already exists");

    const result = await checkOtp(newEmail, "email-change", otp);
    if (!result.ok) return fail(res, 400, result.message);

    const user = await User.findByIdAndUpdate(req.user._id, { email: newEmail }, { new: true });
    res.json({ success: true, message: "Email updated successfully", user: publicUser(user) });
  } catch (error) {
    handleError(res, error, "Verify email change error:");
  }
};

// PUT /api/auth/change-password  body: { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
  try {
    const body = req.body || {};
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword)
      return fail(res, 400, "Please provide current and new password");

    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    )
      return fail(res, 400, "Password must be at least 8 characters with letters and numbers");

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword)))
      return fail(res, 401, "Current password is incorrect");

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    handleError(res, error, "Change password error:");
  }
};
