require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const [email, newPassword] = process.argv.slice(2);
if (!email || !newPassword) {
  console.error("Usage: node scripts/resetPassword.js <email> <newPassword>");
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }
  user.password = newPassword;
  await user.save(); // bcrypt hash automatically lagega pre-save hook se
  console.log(`✅ ${user.email} ka password reset ho gaya`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
