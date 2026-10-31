// backend/utils/leadReminder.js
const cron = require("node-cron");
const User = require("../models/User");
const Lead = require("../models/Lead");
const { sendLeadReminderEmail } = require("./sendEmail");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // India = UTC+5:30
const SEND_FROM_HOUR = 9; // subah 9 baje se mail bhejna shuru
const SEND_UNTIL_HOURS = 12; // 9 baje + 12 ghante = raat 9 baje tak catch-up

// Aaj ke din ka "subah 9:00 IST" kitne baje hua (UTC timestamp mein)
const getTodayNineIST = () => {
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const utcMs = Date.UTC(
    nowIst.getUTCFullYear(),
    nowIst.getUTCMonth(),
    nowIst.getUTCDate(),
    SEND_FROM_HOUR,
    0,
    0,
  );
  return new Date(utcMs - IST_OFFSET_MS);
};

let isRunning = false;

const runReminderJob = async () => {
  if (isRunning) return; // pichla run abhi chal raha hai
  isRunning = true;

  try {
    const nineAm = getTodayNineIST();
    const now = new Date();

    // 9 baje se pehle ya raat 9 baje ke baad mail nahi bhejni
    if (now < nineAm) return;
    if (now.getTime() > nineAm.getTime() + SEND_UNTIL_HOURS * 60 * 60 * 1000)
      return;

    // Jinko AAJ 9 baje ke baad abhi tak mail nahi gayi
    const users = await User.find({
      isVerified: true,
      isBlocked: false,
      $or: [{ lastReminderAt: null }, { lastReminderAt: { $lt: nineAm } }],
    }).select("_id name email");

    if (users.length === 0) return;

    console.log(`[Cron] ${users.length} users pending for today's reminder`);
    let sent = 0;

    for (const user of users) {
      try {
        const leads = await Lead.find({ owner: user._id })
          .select("name")
          .lean();
        if (leads.length === 0) continue;

        await sendLeadReminderEmail(user.email, user.name, leads);
        await User.updateOne({ _id: user._id }, { lastReminderAt: new Date() });
        sent++;
        console.log(
          `[Cron] Reminder sent to ${user.email} (${leads.length} leads)`,
        );
      } catch (err) {
        console.error(`[Cron] Failed for ${user.email}:`, err.message);
      }
    }

    console.log(`[Cron] Done. Sent ${sent} reminders.`);
  } catch (err) {
    console.error("[Cron] Lead reminder job error:", err.message);
  } finally {
    isRunning = false;
  }
};

const startLeadReminderCron = () => {
  // Har 10 minute check karo. Server 9:00 par soya ho to jaagte hi
  // agle check mein reminder chali jayegi (raat 9 baje tak).
  cron.schedule("*/10 * * * *", runReminderJob, { timezone: "Asia/Kolkata" });

  // Server start/restart hone ke 30 second baad ek baar turant check
  setTimeout(runReminderJob, 30 * 1000);

  console.log(
    "[Cron] Lead reminder scheduled (checks every 10 min, sends after 9:00 AM IST)",
  );
};

module.exports = { startLeadReminderCron };
