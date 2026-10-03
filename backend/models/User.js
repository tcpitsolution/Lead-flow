const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Naam zaroori hai"],
      trim: true,
      minlength: [2, "Naam kam se kam 2 akshar ka ho"],
      maxlength: [60, "Naam 60 akshar se chhota ho"],
    },
    email: {
      type: String,
      required: [true, "Email zaroori hai"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number zaroori hai"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Sahi 10 digit mobile number daalo"],
    },
    userType: {
      type: String,
      enum: {
        values: ["freelancer", "company_owner"],
        message: "User type galat hai",
      },
      required: [true, "User type chuno"],
    },
    companyName: { type: String, trim: true, maxlength: 100 },
    password: {
      type: String,
      required: [true, "Password zaroori hai"],
      minlength: [8, "Password kam se kam 8 akshar ka ho"],
      select: false,
    },
        isVerified: { type: Boolean, default: false },
        role: { type: String, enum: ["user", "admin"], default: "user" },
    trialEndsAt: { type: Date },
    paidUntil: { type: Date },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, trim: true, maxlength: 200 },
    blockedAt: { type: Date },
    lastLoginAt: { type: Date },
    lastSeenAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
