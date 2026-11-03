const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: { type: String, required: true }, // "1m" | "3m" | "6m" | "1y"
    amount: { type: Number, required: true },
    days: { type: Number, required: true },

    // Razorpay fields
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },

    // पुराने UPI records के लिए (अब ज़रूरी नहीं)
    utrNumber: { type: String, trim: true, maxlength: 50 },
    upiId: { type: String },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "pending", "approved", "rejected"],
      default: "created",
      index: true,
    },
    rejectedReason: { type: String, trim: true, maxlength: 200 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);
