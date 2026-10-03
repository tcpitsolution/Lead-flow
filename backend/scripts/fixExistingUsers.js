require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    { isVerified: { $ne: true } },
    { $set: { isVerified: true } }
  );
  console.log(`✅ ${result.modifiedCount} users ko verified mark kar diya`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
