const cron = require("node-cron");
const User = require("../models/User");
const Lead = require("../models/Lead");
const { sendLeadReminderEmail } = require("./sendEmail");

const startLeadReminderCron = () => {
  // Roz subah 9:00 baje (India time)
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("[Cron] Lead reminder job started...");
      try {
        // 20 ghante se pehle jinko mail gaya, unko dobara nahi bhejna
        const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);

        const users = await User.find({
          isVerified: true,
          isBlocked: false,
          $or: [{ lastReminderAt: null }, { lastReminderAt: { $lt: cutoff } }],
        }).select("_id name email");

        for (const user of users) {
          try {
            const leads = await Lead.find({ owner: user._id })
              .select("name")
              .lean();
            if (leads.length === 0) continue;

            await sendLeadReminderEmail(user.email, user.name, leads);
            await User.updateOne(
              { _id: user._id },
              { lastReminderAt: new Date() },
            );

            console.log(
              `[Cron] Reminder sent to ${user.email} (${leads.length} leads)`,
            );
          } catch (err) {
            console.error(`[Cron] Failed for ${user.email}:`, err.message);
          }
        }
      } catch (err) {
        console.error("[Cron] Lead reminder job error:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("[Cron] Lead reminder scheduled (daily 9:00 AM IST)");
};

module.exports = { startLeadReminderCron };
