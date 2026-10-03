const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Prospect = require("../models/Prospect");
const Payment = require("../models/Payment");
const PaymentRequest = require("../models/PaymentRequest");
const Settings = require("../models/Settings");
const protect = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/accessMiddleware");
const { TRIAL_DAYS, DAY, trialEnd, getAccess } = require("../utils/access");

const router = express.Router();
router.use(protect, requireAdmin);

// debug: log every admin request
router.use((req, res, next) => {
  console.log(`[ADMIN] ${req.method} ${req.path}`);
  next();
});

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const intDays = (v, max) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
};

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(404).json({ success: false, message: "User not found" });

const findUser = (id) => User.findOne({ _id: id, role: { $nin: ["admin"] } });

const adminUser = (u, counts = {}) => {
  const access = getAccess(u);
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    userType: u.userType,
    companyName: u.companyName,
    isVerified: u.isVerified,
    isBlocked: !!u.isBlocked,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null,
    lastSeenAt: u.lastSeenAt || null,
    loginCount: u.loginCount || 0,
    trialEndsAt: trialEnd(u),
    paidUntil: u.paidUntil || null,
    access,
    status: u.isVerified ? access.status : "unverified",
    leads: counts.leads || 0,
    prospects: counts.prospects || 0,
  };
};

function buildQuery(filter = "all", search = "") {
  const now = new Date();
  const effEnd = {
    $ifNull: ["$trialEndsAt", { $add: ["$createdAt", TRIAL_DAYS * DAY] }],
  };
  const live = { isBlocked: { $ne: true }, isVerified: true };
  const notPaid = { $or: [{ paidUntil: null }, { paidUntil: { $lte: now } }] };
  const parts = [{ role: { $ne: "admin" } }];

  if (filter === "trial")
    parts.push(live, notPaid, { $expr: { $gt: [effEnd, now] } });
  else if (filter === "expired")
    parts.push(live, notPaid, { $expr: { $lte: [effEnd, now] } });
  else if (filter === "paid") parts.push(live, { paidUntil: { $gt: now } });
  else if (filter === "blocked") parts.push({ isBlocked: true });
  else if (filter === "unverified") parts.push({ isVerified: false });

  if (search) {
    const rx = new RegExp(escapeRx(search), "i");
    parts.push({ $or: [{ name: rx }, { email: rx }, { phone: rx }] });
  }
  return { $and: parts };
}

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = (ms) => new Date(Date.now() - ms);
  const notAdmin = { role: { $ne: "admin" } };

  const [
    total, unverified, trial, expired, paid, blocked,
    newToday, new7d, online, active24h, active7d,
    leads, prospects, revenueAll, revenueMonth, recentPayments, signupAgg,
  ] = await Promise.all([
    User.countDocuments(buildQuery("all")),
    User.countDocuments(buildQuery("unverified")),
    User.countDocuments(buildQuery("trial")),
    User.countDocuments(buildQuery("expired")),
    User.countDocuments(buildQuery("paid")),
    User.countDocuments(buildQuery("blocked")),
    User.countDocuments({ ...notAdmin, createdAt: { $gte: startOfToday } }),
    User.countDocuments({ ...notAdmin, createdAt: { $gte: since(7 * DAY) } }),
    User.countDocuments({ ...notAdmin, lastSeenAt: { $gte: since(10 * 60 * 1000) } }),
    User.countDocuments({ ...notAdmin, lastSeenAt: { $gte: since(DAY) } }),
    User.countDocuments({ ...notAdmin, lastSeenAt: { $gte: since(7 * DAY) } }),
    Lead.countDocuments(),
    Prospect.countDocuments(),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.find().sort({ createdAt: -1 }).limit(8).populate("user", "name email"),
    User.aggregate([
      { $match: { ...notAdmin, createdAt: { $gte: since(14 * DAY) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          n: { $sum: 1 },
        },
      },
    ]),
  ]);

  const byDay = new Map(signupAgg.map((r) => [r._id, r.n]));
  const signups = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    signups.push({ day, n: byDay.get(day) || 0 });
  }

  res.json({
    success: true,
    stats: {
      users: { total, verified: total - unverified, unverified, trial, expired, paid, blocked },
      newToday, new7d, online, active24h, active7d, leads, prospects,
      revenue: { total: revenueAll[0]?.total || 0, thisMonth: revenueMonth[0]?.total || 0 },
      signups,
      recentPayments: recentPayments.map((p) => ({
        id: p._id,
        user: p.user ? { name: p.user.name, email: p.user.email } : null,
        amount: p.amount,
        days: p.days,
        note: p.note || "",
        createdAt: p.createdAt,
      })),
    },
  });
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  const filter = typeof req.query.filter === "string" ? req.query.filter : "all";
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 60) : "";
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 50);

  const q = buildQuery(filter, search);
  const [users, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(q),
  ]);

  const ids = users.map((u) => u._id);
  const [leadAgg, prospectAgg] = await Promise.all([
    Lead.aggregate([{ $match: { owner: { $in: ids } } }, { $group: { _id: "$owner", n: { $sum: 1 } } }]),
    Prospect.aggregate([{ $match: { owner: { $in: ids } } }, { $group: { _id: "$owner", n: { $sum: 1 } } }]),
  ]);
  const L = new Map(leadAgg.map((r) => [String(r._id), r.n]));
  const P = new Map(prospectAgg.map((r) => [String(r._id), r.n]));

  res.json({
    success: true,
    users: users.map((u) => adminUser(u, { leads: L.get(String(u._id)), prospects: P.get(String(u._id)) })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// PATCH /api/admin/users/:id/block
router.patch("/users/:id/block", validId, async (req, res) => {
  const u = await findUser(req.params.id);
  if (!u) return res.status(404).json({ success: false, message: "User not found" });

  const blocked = req.body?.blocked === true;
  u.isBlocked = blocked;
  u.blockedReason = blocked ? clean(req.body?.reason, 200) : "";
  u.blockedAt = blocked ? new Date() : undefined;
  await u.save();

  res.json({
    success: true,
    message: blocked ? `${u.name} has been blocked` : `${u.name} has been unblocked`,
    user: adminUser(u),
  });
});

// POST /api/admin/users/:id/recharge
router.post("/users/:id/recharge", validId, async (req, res) => {
  const days = intDays(req.body?.days, 3650);
  if (!days) return res.status(400).json({ success: false, message: "Days must be between 1 and 3650" });

  const amount = Math.max(Number(req.body?.amount) || 0, 0);
  const u = await findUser(req.params.id);
  if (!u) return res.status(404).json({ success: false, message: "User not found" });

  const base = Math.max(Date.now(), u.paidUntil ? new Date(u.paidUntil).getTime() : 0);
  u.paidUntil = new Date(base + days * DAY);
  await u.save();

  await Payment.create({ user: u._id, amount, days, note: clean(req.body?.note, 200), by: req.user._id });

  const until = u.paidUntil.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  res.json({
    success: true,
    message: u.isBlocked
      ? `Recharged until ${until}, but account is still blocked. Unblock if needed.`
      : `${u.name} recharged successfully, active until ${until}`,
    user: adminUser(u),
  });
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", validId, async (req, res) => {
  const u = await findUser(req.params.id);
  if (!u) return res.status(404).json({ success: false, message: "User not found" });

  await Promise.all([
    User.deleteOne({ _id: u._id }),
    Lead.deleteMany({ owner: u._id }),
    Prospect.deleteMany({ owner: u._id }),
    Payment.deleteMany({ user: u._id }),
  ]);

  res.json({ success: true, message: `${u.name}'s account has been deleted` });
});

// POST /api/admin/users/:id/extend-trial
router.post("/users/:id/extend-trial", validId, async (req, res) => {
  const days = intDays(req.body?.days, 365);
  if (!days) return res.status(400).json({ success: false, message: "Days must be between 1 and 365" });

  const u = await findUser(req.params.id);
  if (!u) return res.status(404).json({ success: false, message: "User not found" });

  const base = Math.max(Date.now(), trialEnd(u).getTime());
  u.trialEndsAt = new Date(base + days * DAY);
  await u.save();

  res.json({ success: true, message: `${u.name}'s trial extended by ${days} days`, user: adminUser(u) });
});

// GET /api/admin/settings/upi
router.get("/settings/upi", async (req, res) => {
  const setting = await Settings.findOne({ key: "upi_id" });
  res.json({ success: true, upiId: setting?.value || "diveshk960-1@okhdfcbank" });
});

// PUT /api/admin/settings/upi
router.put("/settings/upi", async (req, res) => {
  const upiId = typeof req.body?.upiId === "string" ? req.body.upiId.trim() : "";
  if (!upiId) return res.status(400).json({ success: false, message: "UPI ID is required" });
  await Settings.findOneAndUpdate({ key: "upi_id" }, { value: upiId }, { upsert: true, new: true });
  res.json({ success: true, message: "UPI ID updated successfully", upiId });
});

// GET /api/admin/payment-requests
router.get("/payment-requests", async (req, res) => {
  const status = ["pending", "approved", "rejected"].includes(req.query.status)
    ? req.query.status : "pending";
  const requests = await PaymentRequest.find({ status })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, requests });
});

// PATCH /api/admin/payment-requests/:id/approve
router.patch("/payment-requests/:id/approve", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ success: false, message: "Request not found" });

  const pr = await PaymentRequest.findOne({ _id: req.params.id, status: "pending" }).populate("user");
  if (!pr) return res.status(404).json({ success: false, message: "Pending request not found" });

  const u = pr.user;
  const base = Math.max(Date.now(), u.paidUntil ? new Date(u.paidUntil).getTime() : 0);
  u.paidUntil = new Date(base + pr.days * DAY);
  await u.save();

  await Payment.create({ user: u._id, amount: pr.amount, days: pr.days, note: `UTR: ${pr.utrNumber}`, by: req.user._id });

  pr.status = "approved";
  pr.reviewedBy = req.user._id;
  pr.reviewedAt = new Date();
  await pr.save();

  res.json({ success: true, message: `${u.name}'s payment has been approved` });
});

// PATCH /api/admin/payment-requests/:id/reject
router.patch("/payment-requests/:id/reject", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ success: false, message: "Request not found" });

  const pr = await PaymentRequest.findOne({ _id: req.params.id, status: "pending" });
  if (!pr) return res.status(404).json({ success: false, message: "Pending request not found" });

  pr.status = "rejected";
  pr.rejectedReason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 200) : "";
  pr.reviewedBy = req.user._id;
  pr.reviewedAt = new Date();
  await pr.save();

  res.json({ success: true, message: "Request has been rejected" });
});

module.exports = router;
