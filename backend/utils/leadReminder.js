const cron = require("node-cron");
const User = require("../models/User");
const Lead = require("../models/Lead");
const { sendLeadReminderEmail } = require("./sendEmail");

// Har 5 ghante mein chalega: minute hour * * *
const startLeadReminderCron = () => {
  cron.schedule("0 */5 * * *", async () => {
    console.log("[Cron] Lead reminder job started...");
    try {
      const users = await User.find({ isVerified: true, isBlocked: false }).select("_id name email");

      for (const user of users) {
        const leads = await Lead.find({ owner: user._id }).select("name").lean();
        if (leads.length === 0) continue;

        try {
          await sendLeadReminderEmail(user.email, user.name, leads);
          console.log(`[Cron] Reminder sent to ${user.email} (${leads.length} leads)`);
        } catch (err) {
          console.error(`[Cron] Failed to send reminder to ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[Cron] Lead reminder job error:", err.message);
    }
  });

  console.log("[Cron] Lead reminder scheduled (every 5 hours)");
};

module.exports = { startLeadReminderCron };
