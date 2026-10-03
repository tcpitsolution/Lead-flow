const express = require("express");
const rateLimit = require("express-rate-limit");
const c = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Bahut zyada requests, thodi der baad try karo",
  },
});

router.post("/signup", limiter, c.signup);
router.post("/verify-signup", limiter, c.verifySignup);
router.post("/login", limiter, c.login);
router.post("/verify-login", limiter, c.verifyLogin);
router.post("/resend-otp", limiter, c.resendOtp);
router.get("/me", protect, c.getMe);
router.put("/profile", protect, c.updateProfile);
router.post("/request-email-change", protect, limiter, c.requestEmailChange);
router.post("/verify-email-change", protect, limiter, c.verifyEmailChange);
router.put("/change-password", protect, c.changePassword);

module.exports = router;
