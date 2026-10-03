const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, min: 0, default: 0 },
    days: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true, maxlength: 200 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // kis admin ne kiya
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
