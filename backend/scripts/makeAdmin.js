require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true }
  );
  if (!user) {
    console.error("User not found:", email);
  } else {
    console.log(`✅ ${user.name} (${user.email}) ko admin bana diya gaya`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
