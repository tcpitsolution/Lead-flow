const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true },
    workEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    linkedinId: { type: String, trim: true },
    instagramId: { type: String, trim: true },
    facebookId: { type: String, trim: true },
    twitterId: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    problemNote: { type: String, trim: true, maxlength: 1000 },
    conversionStartDate: { type: Date },
    source: {
      type: String,
      enum: ["manual", "website", "referral", "call", "ai", "other"],
      default: "manual",
    },
    stage: {
      type: String,
      enum: ["website-seo", "other", ""],
      default: "",
    },
    stageNote: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["new", "contacted", "interested", "won", "lost"],
      default: "new",
    },
    dealAmount: { type: Number, min: 0 },
    dealCurrency: { type: String, trim: true, default: "USD" },
    followUpDate: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lead", leadSchema);

