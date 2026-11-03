const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const PaymentRequest = require("../models/PaymentRequest");
const Payment = require("../models/Payment");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Prices are decided only here, never taken from the frontend
const PLANS = {
  "1m": { label: "1 Month", days: 30, amount: 299 },
  "3m": { label: "3 Months", days: 90, amount: 799 },
  "6m": { label: "6 Months", days: 180, amount: 1399 },
  "1y": { label: "1 Year", days: 365, amount: 2499 },
  // To add a Rs 100 plan, uncomment the line below (assumed 30 days, change if needed):
  // "100": { label: "Starter", days: 30, amount: 100 },
};

// WARNING: Put the real field name of your User model here
// (the same field your admin "approve" route changes to extend the plan)
async function activateUserPlan(userId, days) {
  const user = await User.findById(userId);
  const now = new Date();
  const current = user.planExpiresAt; // <- write your own field name here
  const start = current && current > now ? current : now;
  user.planExpiresAt = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  await user.save();
  return user.planExpiresAt;
}

// GET /api/payments/info - plans + Razorpay public key
router.get("/info", async (req, res) => {
  res.json({ success: true, plans: PLANS, keyId: process.env.RAZORPAY_KEY_ID });
});

// POST /api/payments/create-order - when the user clicks "Pay Now"
router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body || {};
    const p = PLANS[plan];
    if (!p)
      return res.status(400).json({ success: false, message: "Invalid plan" });

    const order = await razorpay.orders.create({
      amount: p.amount * 100, // in paise
      currency: "INR",
      receipt: `lf_${Date.now()}`,
    });

    await PaymentRequest.create({
      user: req.user._id,
      plan,
      amount: p.amount,
      days: p.days,
      razorpayOrderId: order.id,
      status: "created",
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planLabel: p.label,
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({
      success: false,
      message: "Could not create the order. Please try again.",
    });
  }
});

// POST /api/payments/verify - verify the signature after payment and activate the plan
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment details" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid) {
      await PaymentRequest.findOneAndUpdate(
        {
          razorpayOrderId: razorpay_order_id,
          user: req.user._id,
          status: "created",
        },
        { status: "failed" },
      );
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Atomic update: the same order can never extend the plan twice
    const reqDoc = await PaymentRequest.findOneAndUpdate(
      {
        razorpayOrderId: razorpay_order_id,
        user: req.user._id,
        status: { $ne: "paid" },
      },
      {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    if (!reqDoc) {
      // Either it is already paid, or the order does not belong to this user
      const already = await PaymentRequest.findOne({
        razorpayOrderId: razorpay_order_id,
        user: req.user._id,
        status: "paid",
      });
      if (already)
        return res.json({ success: true, message: "Plan is already active." });
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const expiresAt = await activateUserPlan(req.user._id, reqDoc.days);

    // Also add an entry in your admin Payment log
    await Payment.create({
      user: req.user._id,
      amount: reqDoc.amount,
      days: reqDoc.days,
      note: `Razorpay ${razorpay_payment_id}`,
    });

    res.json({
      success: true,
      message: "Payment successful! Your plan is active.",
      expiresAt,
    });
  } catch (err) {
    console.error("verify error:", err);
    res.status(500).json({ success: false, message: "Verification error" });
  }
});

// GET /api/payments/my - user views their own payments
router.get("/my", async (req, res) => {
  const requests = await PaymentRequest.find({
    user: req.user._id,
    status: { $in: ["paid", "failed", "pending", "approved", "rejected"] },
  })
    .sort({ createdAt: -1 })
    .limit(10);
  res.json({ success: true, requests });
});

module.exports = router;
