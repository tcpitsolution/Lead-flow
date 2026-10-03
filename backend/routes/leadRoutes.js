const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const { requireActive } = require("../middleware/accessMiddleware");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, requireActive); // is file ke saare routes login maangte hain

// body se sirf ye fields lenge. "owner" kabhi body se nahi aayega.
const FIELDS = [
  "name",
  "email",
  "phone",
  "company",
  "source",
  "status",
  "value",
  "followUpDate",
];
const pick = (obj = {}) =>
  Object.fromEntries(
    FIELDS.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]),
  );

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(404).json({ success: false, message: "Lead nahi mili" });

const notFound = (res) =>
  res.status(404).json({ success: false, message: "Lead nahi mili" });

const STATUSES = ["new", "contacted", "interested", "won", "lost"];
// forecast ke liye: har stage ki deal ke close hone ka andaza (aap badal sakte ho)
const WEIGHT = { new: 0.1, contacted: 0.25, interested: 0.6, won: 1, lost: 0 };

// dashboard ke numbers: GET /api/leads/stats/summary
router.get("/stats/summary", async (req, res) => {
  const owner = req.user._id;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const open = { $nin: ["won", "lost"] };

  const [grouped, dueToday, overdue, recent] = await Promise.all([
    Lead.aggregate([
      { $match: { owner } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          value: { $sum: "$value" },
        },
      },
    ]),
    Lead.countDocuments({
      owner,
      status: open,
      followUpDate: { $gte: start, $lte: end },
    }),
    Lead.countDocuments({ owner, status: open, followUpDate: { $lt: start } }),
    Lead.find({ owner }).sort({ createdAt: -1 }).limit(5),
  ]);

  const byStatus = {};
  STATUSES.forEach((s) => (byStatus[s] = { count: 0, value: 0 }));
  grouped.forEach((g) => {
    if (byStatus[g._id]) byStatus[g._id] = { count: g.count, value: g.value };
  });

  const total = STATUSES.reduce((n, s) => n + byStatus[s].count, 0);
  const forecast = STATUSES.reduce(
    (sum, s) => sum + byStatus[s].value * WEIGHT[s],
    0,
  );
  const pipelineValue = STATUSES.filter(
    (s) => s !== "won" && s !== "lost",
  ).reduce((sum, s) => sum + byStatus[s].value, 0);

  res.json({
    success: true,
    stats: {
      total,
      byStatus,
      wonValue: byStatus.won.value,
      pipelineValue,
      forecast: Math.round(forecast),
      conversionRate: total
        ? Math.round((byStatus.won.count / total) * 100)
        : 0,
      dueToday,
      overdue,
      recent,
    },
  });
});

// list: ?search=&status=&page=1&limit=10
router.get("/", async (req, res) => {
  const filter = { owner: req.user._id };

  const status = typeof req.query.status === "string" ? req.query.status : "";
  if (status) filter.status = status;

  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { company: rx }, { email: rx }, { phone: rx }];
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

router.post("/", async (req, res) => {
  const lead = await Lead.create({ ...pick(req.body), owner: req.user._id });
  res.status(201).json({ success: true, lead });
});

router.get("/:id", validId, async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
  if (!lead) return notFound(res);
  res.json({ success: true, lead });
});

router.put("/:id", validId, async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    pick(req.body),
    { new: true, runValidators: true },
  );
  if (!lead) return notFound(res);
  res.json({ success: true, lead });
});

router.delete("/:id", validId, async (req, res) => {
  const lead = await Lead.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!lead) return notFound(res);
  res.json({ success: true, message: "Lead delete ho gayi" });
});

module.exports = router;
