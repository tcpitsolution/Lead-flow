// backend/utils/leadReminder.js
const cron = require("node-cron");
const User = require("../models/User");
const Lead = require("../models/Lead");
const { sendLeadReminderEmail } = require("./sendEmail");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // India = UTC+5:30
const SEND_FROM_HOUR = 9; // subah 9 baje se mail bhejna shuru
const SEND_UNTIL_HOURS = 15; // 9 baje + 15 ghante = raat 12 baje (midnight) tak

// Lead model mein "owner" ka asli naam apne aap dhoondho
const OWNER_FIELD =
  ["owner", "user", "createdBy", "userId", "createdby"].find((f) =>
    Lead.schema.path(f),
  ) || "owner";

const istText = (d) =>
  new Date(d.getTime() + IST_OFFSET_MS).toISOString().replace("T", " ").slice(0, 16) + " IST";

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
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const nineAm = getTodayNineIST();
    console.log(`[Cron] Check at ${istText(now)}`);

    if (now < nineAm) {
      console.log("[Cron] Abhi 9:00 AM se pehle ka time hai, skip.");
      return;
    }
    if (now.getTime() > nineAm.getTime() + SEND_UNTIL_HOURS * 60 * 60 * 1000) {
      console.log("[Cron] Raat 9 baje ke baad ka time hai, skip.");
      return;
    }

    const users = await User.find({
      isVerified: true,
      isBlocked: false,
      $or: [{ lastReminderAt: null }, { lastReminderAt: { $lt: nineAm } }],
    }).select("_id name email");

    if (users.length === 0) {
      console.log("[Cron] Aaj ki reminder ke liye koi user pending nahi (sab ko ja chuki ya koi verified user nahi).");
      return;
    }

    console.log(`[Cron] ${users.length} users pending (leads field: "${OWNER_FIELD}")`);
    let sent = 0;
    let noLeads = 0;

    for (const user of users) {
      try {
        const leads = await Lead.find({ [OWNER_FIELD]: user._id })
          .select("name")
          .lean();

        if (leads.length === 0) {
          noLeads++;
          console.log(`[Cron] Skip ${user.email}: 0 leads mili`);
          continue;
        }

        await sendLeadReminderEmail(user.email, user.name, leads);
        await User.updateOne({ _id: user._id }, { lastReminderAt: new Date() });
        sent++;
        console.log(`[Cron] Reminder sent to ${user.email} (${leads.length} leads)`);
      } catch (err) {
        console.error(`[Cron] Failed for ${user.email}:`, err.message);
      }
    }

    console.log(`[Cron] Done. Sent=${sent}, 0-leads skipped=${noLeads}`);
  } catch (err) {
    console.error("[Cron] Lead reminder job error:", err.message);
  } finally {
    isRunning = false;
  }
};

const startLeadReminderCron = () => {
  cron.schedule("*/10 * * * *", runReminderJob, { timezone: "Asia/Kolkata" });
  setTimeout(runReminderJob, 30 * 1000);
  console.log(
    `[Cron] Lead reminder scheduled (every 10 min, after 9:00 AM IST). Lead owner field: "${OWNER_FIELD}"`,
  );
};

module.exports = { startLeadReminderCron };