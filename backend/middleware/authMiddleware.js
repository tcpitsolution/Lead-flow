const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getAccess } = require("../utils/access");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Pehle login karo" });
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);

    if (!user || !user.isVerified) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Account not found, please log in again",
        });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({
          success: false,
          code: "ACCOUNT_BLOCKED",
          message: "Your account has been blocked. Please contact admin.",
        });
    }

    req.user = user;
    req.access = getAccess(user);

    // "online" ginne ke liye, har request par database write na ho isliye 5 minute mein ek baar
    if (
      !user.lastSeenAt ||
      Date.now() - user.lastSeenAt.getTime() > 5 * 60 * 1000
    ) {
      User.updateOne({ _id: user._id }, { lastSeenAt: new Date() }).catch(
        () => {},
      );
    }

    next();
  } catch {
    res
      .status(401)
      .json({
        success: false,
        message: "Session expire ho gaya, dobara login karo",
      });
  }
};

module.exports = protect;
