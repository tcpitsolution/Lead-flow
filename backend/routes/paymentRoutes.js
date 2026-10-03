const express = require("express");
const Settings = require("../models/Settings");
const PaymentRequest = require("../models/PaymentRequest");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

const PLANS = {
  "1m":  { label: "1 Month",  days: 30,  amount: 299 },
  "3m":  { label: "3 Months", days: 90,  amount: 799 },
  "6m":  { label: "6 Months", days: 180, amount: 1399 },
  "1y":  { label: "1 Year",   days: 365, amount: 2499 },
};

// GET /api/payments/info  — plans + current UPI ID
router.get("/info", async (req, res) => {
  const setting = await Settings.findOne({ key: "upi_id" });
  const upiId = setting?.value || "diveshk960-1@okhdfcbank";
  res.json({ success: true, plans: PLANS, upiId });
});

// POST /api/payments/request  — user submits UTR after paying
router.post("/request", async (req, res) => {
  const { plan, utrNumber } = req.body || {};
  if (!PLANS[plan]) return res.status(400).json({ success: false, message: "Invalid plan" });

  const utr = typeof utrNumber === "string" ? utrNumber.trim() : "";
  if (!utr || utr.length < 6) return res.status(400).json({ success: false, message: "Valid UTR/Transaction ID daalo" });

  // duplicate UTR check
  const exists = await PaymentRequest.findOne({ utrNumber: utr });
  if (exists) return res.status(409).json({ success: false, message: "Yeh UTR already submit ho chuka hai" });

  // pending request already hai?
  const pending = await PaymentRequest.findOne({ user: req.user._id, status: "pending" });
  if (pending) return res.status(409).json({ success: false, message: "Aapka ek request already pending hai, admin se contact karo" });

  const setting = await Settings.findOne({ key: "upi_id" });
  const upiId = setting?.value || "diveshk960-1@okhdfcbank";

  const p = PLANS[plan];
  await PaymentRequest.create({
    user: req.user._id,
    plan,
    amount: p.amount,
    days: p.days,
    utrNumber: utr,
    upiId,
  });

  res.json({ success: true, message: "Payment request submit ho gayi! Admin verify karke activate kar dega." });
});

// GET /api/payments/my  — user apni requests dekhe
router.get("/my", async (req, res) => {
  const requests = await PaymentRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
  res.json({ success: true, requests });
});

module.exports = router;
