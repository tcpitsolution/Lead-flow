// services/enrich.js

const dns = require("dns").promises;
const net = require("net");

const FETCH_TIMEOUT_MS = 10000;

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return (
      l === "::1" ||
      l === "::" ||
      l.startsWith("fc") ||
      l.startsWith("fd") ||
      l.startsWith("fe80") ||
      l.startsWith("::ffff:")
    );
  }
  return true;
};

async function safeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
    return null;
  const addrs = await dns.lookup(u.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return null;
  return u;
}

// meta (optional object) receives meta.finalUrl = the URL after redirects.
async function fetchHtml(raw, hops = 3, meta = {}) {
  let url = raw;
  for (let i = 0; i <= hops; i++) {
    const u = await safeUrl(url);
    if (!u) return "";

    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "LeadFlowBot/1.0 (business contact lookup)",
        Accept: "text/html",
      },
    }).catch(() => null);
    if (!res) return "";

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return "";
      url = new URL(loc, u).toString();
      continue;
    }
    if (
      !res.ok ||
      !(res.headers.get("content-type") || "").includes("text/html")
    )
      return "";

    meta.finalUrl = u.toString();

    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 1_000_000) {
        reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return "";
}

const EMAIL_RX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const JUNK =
  /\.(png|jpe?g|gif|svg|webp)$|sentry|wixpress|example\.|domain\.com|yourname|your-?email/i;
const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function extractEmails(html) {
  const found = new Set();
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi))
    found.add(safeDecode(m[1]).toLowerCase());
  for (const m of html.match(EMAIL_RX) || []) found.add(m.toLowerCase());
  return [...found].filter((e) => !JUNK.test(e));
}

const SOCIAL = {
  instagram:
    /https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore|accounts|share)[A-Za-z0-9._]+/i,
  facebook:
    /https?:\/\/(?:www\.|m\.)?facebook\.com\/(?!sharer|share|dialog|tr\?|plugins|login)[A-Za-z0-9.\-_/]+/i,
  linkedin:
    /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9\-_%]+/i,
};

// Helper: check if URL is http (no SSL)
function isHttpOnly(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:";
  } catch {
    return false;
  }
}

// Helper: basic mobile-friendly check (viewport meta tag)
function hasViewportMeta(html) {
  return /<meta[^>]+viewport[^>]*>/i.test(html);
}

// Helper: very rough content thickness check
function isThinContent(html) {
  // remove scripts and styles first so their code is not counted as words
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length < 150;
}

async function enrichWebsite(website) {
  const out = {
    emails: [],
    phones: [],
    instagram: "",
    facebook: "",
    linkedin: "",
    websiteStatus: website ? "basic_ok" : "no_website",
    websiteIssues: [],
    websiteStrengths: [],
    auditScore: 0,
    problem_summary: "",
  };

  if (!website) return out;

  const meta = {};
  const home = await fetchHtml(website, 3, meta);

  if (!home) {
    out.websiteStatus = "broken";
    out.websiteIssues = [
      "Website could not be loaded (down, blocked or very slow)",
    ];
    return out;
  }

  let html = home;
  const link = home.match(/href=["']([^"']*(?:contact|about)[^"']*)["']/i);
  if (link) {
    try {
      const next = new URL(link[1], website);
      if (next.hostname === new URL(website).hostname)
        html += "\n" + (await fetchHtml(next.toString()));
    } catch {
      /* bad link, skip */
    }
  }

  out.emails = extractEmails(html).slice(0, 3);
  out.phones = [
    ...new Set(
      [...html.matchAll(/href=["']tel:([^"']+)/gi)]
        .map((m) => safeDecode(m[1]).replace(/[^\d+]/g, ""))
        .filter((p) => p.length >= 10),
    ),
  ].slice(0, 3);

  for (const [key, rx] of Object.entries(SOCIAL)) {
    const m = html.match(rx);
    if (m) out[key] = m[0].replace(/[/.]+$/, "");
  }

  const issues = [];
  const strengths = [];
  const finalUrl = meta.finalUrl || website;

  if (isHttpOnly(finalUrl)) issues.push("Website is not secure (no HTTPS)");
  else strengths.push("Uses HTTPS");

  if (!hasViewportMeta(home))
    issues.push("Not mobile-friendly (no mobile viewport setting)");
  else strengths.push("Mobile viewport set");

  const title = (home.match(/<title[^>]*>\s*([^<]*)/i) || [])[1] || "";
  if (!title.trim()) issues.push("Missing page title (hurts Google ranking)");

  if (!/<meta[^>]+name=["']description["']/i.test(home))
    issues.push("No meta description (weak SEO)");

  if (!/href=["'](?:tel:|mailto:)|wa\.me|api\.whatsapp\.com|<form/i.test(home))
    issues.push("No call, email, WhatsApp or enquiry form for visitors");

  const yearMatch = home.match(
    /(?:©|&copy;|copyright)[^0-9]{0,30}(?:\d{4}\s*(?:-|–|&ndash;)\s*)?(20\d{2})/i,
  );
  if (yearMatch && Number(yearMatch[1]) <= new Date().getFullYear() - 2)
    issues.push(`Looks outdated (footer shows © ${yearMatch[1]})`);

  if (isThinContent(home))
    issues.push("Very little content (looks like a placeholder site)");

  out.websiteIssues = issues;
  out.websiteStrengths = strengths;
  out.auditScore = Math.max(0, 100 - issues.length * 15);
  out.websiteStatus =
    issues.length >= 4
      ? "needs_redesign"
      : issues.length > 0
        ? "needs_improvement"
        : "basic_ok";

  if (!issues.length) {
    out.problem_summary =
      "Website looks technically fine, but design, speed and SEO improvements could still bring more enquiries.";
  }

  return out;
}

module.exports = { enrichWebsite };
