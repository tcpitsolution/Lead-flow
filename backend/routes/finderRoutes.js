const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const Lead = require("../models/Lead");
const Prospect = require("../models/Prospect");
const auth = require("../middleware/authMiddleware");
const { searchPlaces } = require("../services/places");
const { requireActive } = require("../middleware/accessMiddleware");
const { enrichWebsite } = require("../services/enrich");
const { scoreLeads } = require("../services/ai");

const router = express.Router();
router.use(auth, requireActive); // all routes in this file require authentication

// Rate limit to protect Geoapify free quota: 30 searches per user per hour
const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => String(req.user._id),
  message: {
    success: false,
    message:
      "You have reached the limit of 30 searches per hour. Please try again later.",
  },
});

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const str = (v, max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
const num = (v) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v);
const httpUrl = (v) => {
  if (typeof v !== "string") return undefined;
  try {
    const u = new URL(v.trim());
    return ["http:", "https:"].includes(u.protocol)
      ? u.toString().slice(0, 300)
      : undefined;
  } catch {
    return undefined;
  }
};

// How many websites are checked at the same time, and the total time budget.
// With 50-100 results, checking everything at once would hang the server.
const ENRICH_CONCURRENCY = 8;
const ENRICH_BUDGET_MS = 40000;

async function enrichAll(places) {
  const deadline = Date.now() + ENRICH_BUDGET_MS;
  const out = new Array(places.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= places.length) return;
      const p = places[i];

      let extra = { emails: [], instagram: "", facebook: "", linkedin: "" };
      // after the time budget is over, remaining websites are skipped
      if (p.website && Date.now() < deadline) {
        extra = await enrichWebsite(p.website).catch(() => extra);
      }

      out[i] = {
        ...p,
        emails: [...new Set([...p.emails, ...extra.emails])].slice(0, 3),
        instagram: p.instagram || extra.instagram,
        facebook: p.facebook || extra.facebook,
        linkedin: extra.linkedin,
      };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(ENRICH_CONCURRENCY, places.length) }, worker),
  );
  return out;
}

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(404).json({ success: false, message: "Prospect not found" });

// POST /api/finder/search   { category, city, offer, country, radius, limit, onlyPhone, onlyWebsite }
router.post("/search", searchLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const category = clean(body.category, 60);
    const city = clean(body.city, 60);
    const offer = clean(body.offer, 300);

    if (category.length < 2 || city.length < 2)
      return res.status(400).json({
        success: false,
        message: "Both category and city are required",
      });

    // country: "" = anywhere, 2-letter code like "us" = that country only
    const country =
      typeof body.country === "string"
        ? body.country.trim().toLowerCase()
        : undefined;
    if (country !== undefined && country !== "" && !/^[a-z]{2}$/.test(country))
      return res
        .status(400)
        .json({ success: false, message: "Invalid country code" });

    const places = await searchPlaces(category, city, {
      limit: parseInt(body.limit) || 10,
      radius: Number(body.radius) || 8000,
      country,
      onlyPhone: body.onlyPhone === true,
      onlyWebsite: body.onlyWebsite === true,
    });

    const enriched = await enrichAll(places);

    const scored = await scoreLeads(enriched, offer);

    // mark businesses already saved as prospects or leads
    const saved = await Prospect.find({
      owner: req.user._id,
      placeId: { $in: scored.map((s) => s.placeId) },
    }).select("placeId");
    const savedIds = new Set(saved.map((s) => s.placeId));

    const leads = scored
      .map((s) => ({ ...s, alreadySaved: savedIds.has(s.placeId) }))
      .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));

    res.json({ success: true, leads });
  } catch (err) {
    console.error("Finder search error:", err.message);
    res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Search failed, please try again",
    });
  }
});

// POST /api/finder/save   { items: [...], category, city }
router.post("/save", async (req, res) => {
  const body = req.body || {};
  const list = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  if (!list.length)
    return res
      .status(400)
      .json({ success: false, message: "No businesses selected" });

  const category = clean(body.category, 60) || undefined;
  const city = clean(body.city, 60) || undefined;

  const ids = list.map((i) => str(i.placeId)).filter(Boolean);
  const existing = await Prospect.find({
    owner: req.user._id,
    placeId: { $in: ids },
  }).select("placeId");
  const have = new Set(existing.map((e) => e.placeId));

  const docs = [];
  for (const i of list) {
    const placeId = str(i.placeId);
    const name = str(i.name, 100);
    if (!placeId || !name || have.has(placeId)) continue;
    have.add(placeId);

    const score = num(i.aiScore);
    docs.push({
      owner: req.user._id, // always from token, never from body
      placeId,
      name,
      address: str(i.address, 300),
      phone: str(i.phone, 30),
      emails: (Array.isArray(i.emails) ? i.emails : [])
        .map((e) => str(e, 120))
        .filter(Boolean)
        .slice(0, 3),
      website: httpUrl(i.website),
      instagram: httpUrl(i.instagram),
      facebook: httpUrl(i.facebook),
      linkedin: httpUrl(i.linkedin),
      mapsUrl: httpUrl(i.mapsUrl),
      rating: num(i.rating),
      score:
        score === undefined ? undefined : Math.min(Math.max(score, 0), 100),
      scoreReason: str(i.aiReason, 200),
      category,
      city,
    });
  }

  try {
    if (docs.length) await Prospect.insertMany(docs, { ordered: false });
  } catch (err) {
    // if two saves race, duplicate entries are silently skipped
    if (err.code !== 11000 && err.name !== "MongoBulkWriteError") throw err;
  }

  res.status(201).json({
    success: true,
    added: docs.length,
    skipped: list.length - docs.length,
  });
});

// GET /api/finder/prospects?status=saved
router.get("/prospects", async (req, res) => {
  const status = req.query.status === "converted" ? "converted" : "saved";
  const prospects = await Prospect.find({ owner: req.user._id, status })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, prospects });
});

// POST /api/finder/prospects/:id/convert   -> creates a real Lead
router.post("/prospects/:id/convert", validId, async (req, res) => {
  // claim first to prevent duplicate leads on double-click
  const p = await Prospect.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, status: "saved" },
    { status: "converted" },
  );
  if (!p)
    return res.status(404).json({
      success: false,
      message: "Prospect not found or already converted to a lead",
    });

  try {
    const lead = await Lead.create({
      owner: req.user._id,
      name: p.name,
      company: p.name,
      phone: p.phone || undefined,
      email: p.emails?.[0] || undefined,
      source: "ai",
      status: "new",
    });
    await Prospect.updateOne({ _id: p._id }, { leadId: lead._id });
    res.status(201).json({ success: true, lead });
  } catch (err) {
    await Prospect.updateOne({ _id: p._id }, { status: "saved" }); // revert on failure
    throw err;
  }
});

// DELETE /api/finder/prospects/:id
router.delete("/prospects/:id", validId, async (req, res) => {
  const p = await Prospect.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
    status: "saved",
  });
  if (!p)
    return res
      .status(404)
      .json({ success: false, message: "Prospect not found" });
  res.json({ success: true, message: "Removed successfully" });
});

module.exports = router;
