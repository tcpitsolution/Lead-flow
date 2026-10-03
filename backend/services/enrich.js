const dns = require("dns").promises;
const net = require("net");

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

async function fetchHtml(raw, hops = 3) {
  let url = raw;
  for (let i = 0; i <= hops; i++) {
    const u = await safeUrl(url);
    if (!u) return "";

    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(6000),
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

async function enrichWebsite(website) {
  const out = { emails: [], instagram: "", facebook: "", linkedin: "" };
  if (!website) return out;

  const home = await fetchHtml(website);
  if (!home) return out;

  let html = home;
  const link = home.match(/href=["']([^"']*(?:contact|about)[^"']*)["']/i);
  if (link) {
    try {
      const next = new URL(link[1], website);
      if (next.hostname === new URL(website).hostname)
        html += "\n" + (await fetchHtml(next.toString()));
    } catch {
      /* bad link, skip it */
    }
  }

  out.emails = extractEmails(html).slice(0, 3);
  for (const [key, rx] of Object.entries(SOCIAL)) {
    const m = html.match(rx);
    if (m) out[key] = m[0].replace(/[/.]+$/, "");
  }
  return out;
}

module.exports = { enrichWebsite };
