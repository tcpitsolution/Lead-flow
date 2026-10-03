const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, required: true }, // "1m" | "3m" | "6m" | "1y"
    amount: { type: Number, required: true },
    days: { type: Number, required: true },
    utrNumber: { type: String, required: true, trim: true, maxlength: 50 },
    upiId: { type: String, required: true }, // jo UPI ID us waqt thi
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    rejectedReason: { type: String, trim: true, maxlength: 200 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);
