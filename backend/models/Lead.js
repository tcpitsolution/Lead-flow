const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Lead ka naam chahiye"],
      trim: true,
      maxlength: 100,
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    source: {
      type: String,
      enum: ["manual", "website", "referral", "call", "ai", "other"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "interested", "won", "lost"],
      default: "new",
    },
    value: { type: Number, default: 0, min: 0 },
    followUpDate: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lead", leadSchema);

