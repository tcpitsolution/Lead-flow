const TRIAL_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

// purane users ke paas trialEndsAt nahi hoga, unke liye signup date + 14 din
const trialEnd = (u) =>
  u.trialEndsAt
    ? new Date(u.trialEndsAt)
    : new Date(new Date(u.createdAt).getTime() + TRIAL_DAYS * DAY);

const startTrial = () => new Date(Date.now() + TRIAL_DAYS * DAY);

const daysLeft = (d) =>
  Math.max(Math.ceil((new Date(d).getTime() - Date.now()) / DAY), 0);

// user ki asli halat: admin | blocked | paid | trial | expired
function getAccess(u) {
  if (u.role === "admin") return { status: "admin" };
  if (u.isBlocked) return { status: "blocked", reason: u.blockedReason || "" };

  if (u.paidUntil && new Date(u.paidUntil).getTime() > Date.now()) {
    return {
      status: "paid",
      endsAt: u.paidUntil,
      daysLeft: daysLeft(u.paidUntil),
    };
  }

  const t = trialEnd(u);
  if (t.getTime() > Date.now()) {
    return { status: "trial", endsAt: t, daysLeft: daysLeft(t) };
  }
  return { status: "expired", endsAt: t, daysLeft: 0 };
}

module.exports = { TRIAL_DAYS, DAY, trialEnd, startTrial, getAccess };
