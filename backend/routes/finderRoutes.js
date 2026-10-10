const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const Lead = require("../models/Lead");
const Prospect = require("../models/Prospect");

const auth = require("../middleware/authMiddleware");
const { requireActive } = require("../middleware/accessMiddleware");

const { searchPlaces } = require("../services/places");
const { enrichWebsite } = require("../services/enrich");
const { scoreLeads } = require("../services/ai");

let runPageSpeedAudit = null;

try {
  ({ runPageSpeedAudit } = require("../services/pageSpeed"));
} catch {
  console.warn(
    "PageSpeed service not found. Website checks will use enrichWebsite only.",
  );
}

const router = express.Router();
router.use(auth, requireActive);

// Express 4 does not catch errors thrown inside async routes.
// This wrapper forwards them to the error handler at the bottom of the file.
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => String(req.user._id),
  message: {
    success: false,
    message: "Search limit reached. Please try again later.",
  },
});

const clean = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const str = (value, max = 200) =>
  typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;

const num = (value) =>
  value == null || value === "" || !Number.isFinite(Number(value))
    ? undefined
    : Number(value);

const httpUrl = (value) => {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString().slice(0, 300)
      : undefined;
  } catch {
    return undefined;
  }
};

const ENRICH_CONCURRENCY = 3;
const ENRICH_BUDGET_MS = 55000;

// all | no_website | has_website
const LEAD_TYPES = ["all", "no_website", "has_website"];

function emptyPageSpeed() {
  return {
    available: false,
    performance: null,
    seo: null,
    accessibility: null,
    bestPractices: null,
    lcp: "",
    cls: "",
    issues: [],
  };
}

function isValidWhatsAppCandidate(phone, country = "in") {
  if (!phone) return false;

  let digits = String(phone).replace(/\D/g, "");

  if (country === "in" && digits.length === 10) {
    digits = `91${digits}`;
  }

  return digits.length >= 10 && digits.length <= 15;
}

function hasSocialProfile(lead) {
  return Boolean(lead.instagram || lead.facebook || lead.linkedin);
}

function isNoWebsiteLead(lead) {
  return !lead.website;
}

function buildProblemSummary(lead) {
  if (lead.problem_summary) return lead.problem_summary;

  if (!lead.website) {
    return "No official website was found. A professional website may help the business present its services and receive online enquiries.";
  }

  if (lead.websiteStatus === "broken") {
    return "The website could not be reached during the check. Verify the URL before contacting the business.";
  }

  const issues = lead.websiteIssues || [];

  if (issues.length) {
    return `Website checks found: ${issues.slice(0, 3).join("; ")}.`;
  }

  const pageSpeed = lead.pageSpeed || {};
  const scoreParts = [];

  if (pageSpeed.performance != null) {
    scoreParts.push(`mobile performance ${pageSpeed.performance}/100`);
  }
  if (pageSpeed.seo != null) {
    scoreParts.push(`SEO ${pageSpeed.seo}/100`);
  }

  if (scoreParts.length) {
    return `Website audit results: ${scoreParts.join(", ")}.`;
  }

  return "Website found, but no audit result is available. The site may need a manual review.";
}

function calculateWebsiteStatus(place, extra, pageSpeed) {
  if (!place.website) return "no_website";

  const allIssues = [
    ...(extra.websiteIssues || []),
    ...(pageSpeed.issues || []),
  ];

  if (extra.websiteStatus === "broken") return "broken";

  const performance =
    pageSpeed.performance == null ? null : Number(pageSpeed.performance);
  const seo = pageSpeed.seo == null ? null : Number(pageSpeed.seo);

  if (
    (pageSpeed.available && performance !== null && performance < 50) ||
    allIssues.length >= 4
  ) {
    return "needs_redesign";
  }

  if (
    (pageSpeed.available &&
      ((performance !== null && performance < 70) ||
        (seo !== null && seo < 70))) ||
    allIssues.length > 0
  ) {
    return "needs_improvement";
  }

  return extra.websiteStatus || "basic_ok";
}

async function enrichAll(places) {
  const deadline = Date.now() + ENRICH_BUDGET_MS;
  const results = new Array(places.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= places.length) return;

      const place = places[index];

      let extra = {
        emails: [],
        phones: [],
        instagram: "",
        facebook: "",
        linkedin: "",
        websiteStatus: place.website ? "basic_ok" : "no_website",
        websiteIssues: [],
        websiteStrengths: [],
        auditScore: 0,
        problem_summary: "",
      };

      let pageSpeed = emptyPageSpeed();

      if (place.website && Date.now() < deadline) {
        const fallback = extra;

        extra = await enrichWebsite(place.website).catch((error) => {
          console.warn(
            "Website enrichment failed:",
            place.website,
            error.message,
          );
          return fallback;
        });

        if (runPageSpeedAudit && Date.now() < deadline) {
          pageSpeed = await runPageSpeedAudit(place.website).catch((error) => {
            console.warn(
              "PageSpeed audit failed:",
              place.website,
              error.message,
            );
            return emptyPageSpeed();
          });
        }
      }

      const websiteIssues = [
        ...new Set([
          ...(extra.websiteIssues || []),
          ...(pageSpeed.issues || []),
        ]),
      ].slice(0, 10);

      const websiteStatus = calculateWebsiteStatus(
        place,
        { ...extra, websiteIssues },
        pageSpeed,
      );

      const lead = {
        ...place,
        phone: place.phone || extra.phones?.[0] || "",
        emails: [
          ...new Set([...(place.emails || []), ...(extra.emails || [])]),
        ].slice(0, 3),
        instagram: place.instagram || extra.instagram || "",
        facebook: place.facebook || extra.facebook || "",
        linkedin: place.linkedin || extra.linkedin || "",
        websiteStatus,
        websiteIssues,
        websiteStrengths: extra.websiteStrengths || [],
        auditScore: Number(extra.auditScore || 0),
        pageSpeed: {
          available: Boolean(pageSpeed.available),
          performance: pageSpeed.performance ?? null,
          seo: pageSpeed.seo ?? null,
          accessibility: pageSpeed.accessibility ?? null,
          bestPractices: pageSpeed.bestPractices ?? null,
          lcp: pageSpeed.lcp || "",
          cls: pageSpeed.cls || "",
        },
        problem_summary: extra.problem_summary || "",
      };

      lead.problem_summary = buildProblemSummary(lead);
      results[index] = lead;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(ENRICH_CONCURRENCY, places.length) }, worker),
  );

  return results;
}

function validId(req, res, next) {
  if (mongoose.isValidObjectId(req.params.id)) return next();

  return res.status(404).json({
    success: false,
    message: "Prospect not found",
  });
}

// POST /api/finder/search
router.post("/search", searchLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const category = clean(body.category, 60);
    const city = clean(body.city, 60);
    const offer = clean(body.offer, 300);

    if (category.length < 2 || city.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Both category and city are required",
      });
    }

    const country =
      typeof body.country === "string"
        ? body.country.trim().toLowerCase()
        : undefined;

    if (
      country !== undefined &&
      country !== "" &&
      !/^[a-z]{2}$/.test(country)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid country code",
      });
    }

    const leadType = LEAD_TYPES.includes(body.leadType) ? body.leadType : "all";

    const places = await searchPlaces(category, city, {
      limit: parseInt(body.limit, 10) || 10,
      radius: Number(body.radius) || 8000,
      country,

      // Discovery does not do website/contact qualification.
      // The phone filter is applied below, after enrichment.
      onlyPhone: false,
    });

    const enriched = await enrichAll(places);
    const scored = await scoreLeads(enriched, offer);

    // Lead type filter (scored yahin ban chuka hai, isliye yahan use karna safe hai)
    const typeMatches = scored.filter((lead) => {
      if (leadType === "no_website") return isNoWebsiteLead(lead);
      if (leadType === "has_website") return Boolean(lead.website);
      return true; // all
    });

    const qualified = typeMatches
      .filter((lead) => {
        if (body.onlyPhone === true && !lead.phone) return false;

        if (body.onlyEmail === true && !(lead.emails || []).length) {
          return false;
        }

        if (body.onlySocial === true && !hasSocialProfile(lead)) {
          return false;
        }

        if (
          body.onlyWhatsAppReady === true &&
          !isValidWhatsAppCandidate(lead.phone, country)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));

    const resultCounts = {
      discovered: places.length,
      enriched: enriched.length,
      scored: scored.length,
      matchingLeadType: typeMatches.length,
      final: qualified.length,
    };

    console.log("FINDER SEARCH COUNTS", {
      city,
      category,
      leadType,
      selectedFilters: {
        onlyPhone: body.onlyPhone === true,
        onlyEmail: body.onlyEmail === true,
        onlySocial: body.onlySocial === true,
        onlyWhatsAppReady: body.onlyWhatsAppReady === true,
      },
      resultCounts,
      firstRecord: scored[0]
        ? {
            name: scored[0].name,
            website: scored[0].website,
            websiteStatus: scored[0].websiteStatus,
            websiteIssues: scored[0].websiteIssues,
            phone: scored[0].phone,
            emailCount: scored[0].emails?.length || 0,
            instagram: Boolean(scored[0].instagram),
            facebook: Boolean(scored[0].facebook),
            linkedin: Boolean(scored[0].linkedin),
          }
        : null,
    });

    const saved = await Prospect.find({
      owner: req.user._id,
      placeId: { $in: qualified.map((lead) => lead.placeId) },
    }).select("placeId");

    const savedIds = new Set(saved.map((item) => item.placeId));

    const leads = qualified.map((lead) => ({
      ...lead,
      alreadySaved: savedIds.has(lead.placeId),
    }));

    return res.json({
      success: true,
      leads,
      resultCounts,
    });
  } catch (err) {
    console.error("Finder search error:", err.message);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Search failed, please try again",
    });
  }
});

// POST /api/finder/save
router.post(
  "/save",
  wrap(async (req, res) => {
    const body = req.body || {};
    const list = Array.isArray(body.items) ? body.items.slice(0, 100) : [];

    if (!list.length) {
      return res.status(400).json({
        success: false,
        message: "No businesses selected",
      });
    }

    const category = clean(body.category, 60) || undefined;
    const city = clean(body.city, 60) || undefined;

    const ids = list.map((item) => str(item.placeId)).filter(Boolean);

    const existing = await Prospect.find({
      owner: req.user._id,
      placeId: { $in: ids },
    }).select("placeId");

    const have = new Set(existing.map((item) => item.placeId));
    const docs = [];

    for (const item of list) {
      const placeId = str(item.placeId);
      const name = str(item.name, 100);

      if (!placeId || !name || have.has(placeId)) continue;
      have.add(placeId);

      const score = num(item.aiScore ?? item.lead_score);

      docs.push({
        owner: req.user._id,
        placeId,
        name,
        address: str(item.address, 300),
        phone: str(item.phone, 30),
        emails: (Array.isArray(item.emails) ? item.emails : [])
          .map((email) => str(email, 120))
          .filter(Boolean)
          .slice(0, 3),
        website: httpUrl(item.website),
        instagram: httpUrl(item.instagram),
        facebook: httpUrl(item.facebook),
        linkedin: httpUrl(item.linkedin),
        mapsUrl: httpUrl(item.mapsUrl),
        rating: num(item.rating),
        score:
          score === undefined ? undefined : Math.min(Math.max(score, 0), 100),
        scoreReason: str(item.aiReason, 300),
        websiteStatus: str(item.websiteStatus, 60),
        websiteIssues: Array.isArray(item.websiteIssues)
          ? item.websiteIssues
              .map((issue) => str(issue, 200))
              .filter(Boolean)
              .slice(0, 10)
          : [],
        problem_summary: str(item.problem_summary, 600),
        pageSpeed: {
          performance: num(item.pageSpeed?.performance),
          seo: num(item.pageSpeed?.seo),
          accessibility: num(item.pageSpeed?.accessibility),
          bestPractices: num(item.pageSpeed?.bestPractices),
          lcp: str(item.pageSpeed?.lcp, 60),
          cls: str(item.pageSpeed?.cls, 60),
        },
        category,
        city,
      });
    }

    try {
      if (docs.length) {
        await Prospect.insertMany(docs, { ordered: false });
      }
    } catch (err) {
      if (err.code !== 11000 && err.name !== "MongoBulkWriteError") {
        throw err;
      }
    }

    return res.status(201).json({
      success: true,
      added: docs.length,
      skipped: list.length - docs.length,
    });
  }),
);

// GET /api/finder/prospects?status=saved
router.get(
  "/prospects",
  wrap(async (req, res) => {
    const status = req.query.status === "converted" ? "converted" : "saved";

    const prospects = await Prospect.find({
      owner: req.user._id,
      status,
    })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ success: true, prospects });
  }),
);

// POST /api/finder/prospects/:id/convert
router.post(
  "/prospects/:id/convert",
  validId,
  wrap(async (req, res) => {
    const prospect = await Prospect.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
        status: "saved",
      },
      { status: "converted" },
      { new: true },
    );

    if (!prospect) {
      return res.status(404).json({
        success: false,
        message: "Prospect not found or already converted to a lead",
      });
    }

    try {
      const lead = await Lead.create({
        owner: req.user._id,
        name: prospect.name,
        company: prospect.name,
        phone: prospect.phone || undefined,
        email: prospect.emails?.[0] || undefined,
        emails: prospect.emails || [],
        website: prospect.website,
        instagram: prospect.instagram,
        facebook: prospect.facebook,
        linkedin: prospect.linkedin,
        mapsUrl: prospect.mapsUrl,
        place_id: prospect.placeId,
        category: prospect.category,
        city: prospect.city,
        address: prospect.address,
        website_issues: prospect.websiteIssues || [],
        problem_summary: prospect.problem_summary,
        lead_score: prospect.score,
        source_platform: "google_maps",
        source: "ai",
        status: "new",
      });

      await Prospect.updateOne({ _id: prospect._id }, { leadId: lead._id });

      return res.status(201).json({ success: true, lead });
    } catch (err) {
      // Roll back so the prospect can be converted again.
      await Prospect.updateOne({ _id: prospect._id }, { status: "saved" });

      throw err;
    }
  }),
);

// DELETE /api/finder/prospects/:id
router.delete(
  "/prospects/:id",
  validId,
  wrap(async (req, res) => {
    const prospect = await Prospect.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
      status: "saved",
    });

    if (!prospect) {
      return res.status(404).json({
        success: false,
        message: "Prospect not found",
      });
    }

    return res.json({
      success: true,
      message: "Removed successfully",
    });
  }),
);

// Error handler for the wrapped routes above.
// Without this, an error in save/convert/delete would leave the request hanging.
router.use((err, req, res, next) => {
  console.error("Finder route error:", err.message);

  if (res.headersSent) return next(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This record already exists",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)[0]?.message || "Invalid data",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : "Server error, please try again",
  });
});

module.exports = router;
