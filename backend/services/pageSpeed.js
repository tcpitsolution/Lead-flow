const API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const empty = () => ({
  available: false,
  performance: null,
  seo: null,
  accessibility: null,
  bestPractices: null,
  lcp: "",
  cls: "",
  issues: [],
});

async function runPageSpeedAudit(url) {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key || !url) return empty();

  const params = new URLSearchParams({ url, strategy: "mobile", key });
  ["performance", "seo", "accessibility", "best-practices"].forEach((c) =>
    params.append("category", c),
  );

  const res = await fetch(`${API}?${params}`, {
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return empty();

  const j = await res.json();
  const cats = j.lighthouseResult?.categories || {};
  const audits = j.lighthouseResult?.audits || {};
  const pct = (c) => (c?.score != null ? Math.round(c.score * 100) : null);

  const performance = pct(cats.performance);
  const seo = pct(cats.seo);
  const accessibility = pct(cats.accessibility);
  const bestPractices = pct(cats["best-practices"]);

  const issues = [];
  if (performance != null && performance < 50)
    issues.push(`Very slow on mobile (speed score ${performance}/100)`);
  else if (performance != null && performance < 70)
    issues.push(`Slow on mobile (speed score ${performance}/100)`);
  if (seo != null && seo < 70) issues.push(`Weak SEO (${seo}/100)`);
  if (accessibility != null && accessibility < 60)
    issues.push(`Poor accessibility (${accessibility}/100)`);
  if (bestPractices != null && bestPractices < 70)
    issues.push(`Technical best practices missing (${bestPractices}/100)`);

  return {
    available: true,
    performance,
    seo,
    accessibility,
    bestPractices,
    lcp: audits["largest-contentful-paint"]?.displayValue || "",
    cls: audits["cumulative-layout-shift"]?.displayValue || "",
    issues,
  };
}

module.exports = { runPageSpeedAudit };
