// trial khatam ya block hone par data wale routes band
const requireActive = (req, res, next) => {
  const status = req.access?.status;

  if (status === "blocked") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_BLOCKED",
      message: "Aapka account block kar diya gaya hai. Admin se sampark karo.",
    });
  }
  if (status === "expired") {
    return res.status(403).json({
      success: false,
      code: "TRIAL_EXPIRED",
      message:
        "Aapka free trial khatam ho gaya hai. Recharge ke liye admin se sampark karo.",
    });
  }
  next();
};

const requireAdmin = (req, res, next) =>
  req.user?.role === "admin"
    ? next()
    : res
        .status(403)
        .json({ success: false, message: "Ye sirf admin ke liye hai" });

module.exports = { requireActive, requireAdmin };
