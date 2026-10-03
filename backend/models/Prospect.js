const mongoose = require("mongoose");

const prospectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    placeId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, trim: true, maxlength: 300 },
    phone: { type: String, trim: true, maxlength: 30 },
    emails: [{ type: String, trim: true, lowercase: true, maxlength: 120 }],
    website: { type: String, trim: true, maxlength: 300 },
    instagram: { type: String, trim: true, maxlength: 300 },
    facebook: { type: String, trim: true, maxlength: 300 },
    linkedin: { type: String, trim: true, maxlength: 300 },
    mapsUrl: { type: String, trim: true, maxlength: 300 },
    rating: { type: Number },
    score: { type: Number, min: 0, max: 100 },
    scoreReason: { type: String, trim: true, maxlength: 200 },
    category: { type: String, trim: true, maxlength: 60 }, // kis search se mila
    city: { type: String, trim: true, maxlength: 60 },
    status: { type: String, enum: ["saved", "converted"], default: "saved" },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" }, // convert hone par
  },
  { timestamps: true },
);

// ek user ek business ko do baar save nahi kar sakta
prospectSchema.index({ owner: 1, placeId: 1 }, { unique: true });

module.exports = mongoose.model("Prospect", prospectSchema);
