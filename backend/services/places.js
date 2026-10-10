const BASE = "https://api.geoapify.com";
const GOOGLE_URL = "https://places.googleapis.com/v1/places:searchText";

const RADII = [3000, 8000, 15000, 25000];
const ALLOWED_LIMITS = [10, 20, 50, 100];

const cityCache = new Map();

// User-entered category -> Geoapify categories (used only as fallback).
const CATEGORY_MAP = [
  [/dentist|dental|orthodont/, ["healthcare.dentist"]],
  [/hospital|nursing home/, ["healthcare.hospital"]],
  [
    /pharmacy|chemist|medical store/,
    ["healthcare.pharmacy", "commercial.health_and_beauty.pharmacy"],
  ],
  [/doctor|clinic|physician|dermat|physio/, ["healthcare.clinic_or_praxis"]],
  [/optician|spectacle/, ["commercial.health_and_beauty.optician"]],
  [/restaurant|dhaba|eatery/, ["catering.restaurant"]],
  [/cafe|coffee/, ["catering.cafe"]],
  [/fast food|burger|pizza/, ["catering.fast_food"]],
  [/bakery|cake/, ["commercial.food_and_drink.bakery"]],
  [/\bbars?\b|\bpubs?\b/, ["catering.bar", "catering.pub"]],
  [
    /hotel|resort|lodge|guest house/,
    ["accommodation.hotel", "accommodation.guest_house"],
  ],
  [/salon|parlou?r|beauty|barber|hair ?dresser/, ["service.beauty"]],
  [
    /\bspa\b|massage/,
    ["service.beauty.spa", "service.beauty.massage", "leisure.spa"],
  ],
  [/gym|fitness|yoga|martial|karate|sports? club/, ["sport"]],
  [/driving/, ["education.driving_school"]],
  [/kindergarten|play ?school|daycare|creche/, ["childcare"]],
  [
    /school|tuition|coaching|institute/,
    [
      "education.school",
      "education.college",
      "education.language_school",
      "education.music_school",
    ],
  ],
  [/college|university/, ["education.college", "education.university"]],
  [/lawyer|advocate|attorney/, ["office.lawyer"]],
  [
    /\bca\b|chartered|accountant|accounting|tax/,
    ["office.accountant", "office.tax_advisor"],
  ],
  [
    /architect|interior/,
    ["office.architect", "commercial.furniture_and_interior"],
  ],
  [/software|\bit\b|web|\bapp\b/, ["office.it"]],
  [/marketing|advertis|digital agency|media/, ["office.advertising_agency"]],
  [/consult/, ["office.consulting"]],
  [
    /real estate|property|estate agent|builder|broker/,
    ["office.estate_agent", "service.estate_agent"],
  ],
  [/insurance/, ["office.insurance"]],
  [/travel|tour operator/, ["office.travel_agent", "service.travel_agency"]],
  [/logistic|courier|transport|cargo/, ["office.logistics"]],
  [/cowork|co-work/, ["office.coworking"]],
  [/bank|finance|loan/, ["service.financial.bank", "office.financial"]],
  [/photograph/, ["service.photographer"]],
  [
    /wedding|event|banquet|decorator/,
    ["commercial.wedding", "activity.events_venue"],
  ],
  [/boutique|cloth|garment|fashion|apparel/, ["commercial.clothing"]],
  [/jewel/, ["commercial.jewelry"]],
  [/mobile shop|electronic|computer|laptop/, ["commercial.elektronics"]],
  [/furniture/, ["commercial.furniture_and_interior"]],
  [
    /hardware|tiles|paint|building material/,
    ["commercial.houseware_and_hardware"],
  ],
  [
    /car repair|garage|mechanic|workshop|bike repair/,
    ["service.vehicle.repair"],
  ],
  [/car dealer|showroom|automobile/, ["commercial.vehicle"]],
  [/\bpets?\b|\bvet/, ["pet"]],
  [/florist|flower/, ["commercial.florist"]],
  [/gift/, ["commercial.gift_and_souvenir"]],
  [/book|stationer/, ["commercial.books", "commercial.stationery"]],
  [
    /grocery|supermarket|kirana|general store/,
    ["commercial.supermarket", "commercial.convenience"],
  ],
  [/tailor/, ["service.tailor"]],
  [/laundry|dry clean/, ["service.cleaning"]],
  [/factory|manufactur/, ["production.factory"]],
];

const fail = (status, message) => Object.assign(new Error(message), { status });

function resolveCategories(text) {
  const category = String(text || "").toLowerCase();

  for (const [regex, categories] of CATEGORY_MAP) {
    if (regex.test(category)) return categories;
  }

  return null;
}

function resolveLimit(opts) {
  return ALLOWED_LIMITS.includes(Number(opts.limit)) ? Number(opts.limit) : 10;
}

function resolveRadius(opts) {
  return RADII.includes(Number(opts.radius)) ? Number(opts.radius) : 8000;
}

function resolveCountry(opts) {
  return opts.country === undefined
    ? process.env.GEOAPIFY_COUNTRY || "in"
    : opts.country;
}

// ---------- Geoapify helpers ----------

async function geocodeCity(city, country, apiKey) {
  const cacheKey = `${country || ""}|${city.toLowerCase()}`;

  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    text: city,
    limit: "1",
    format: "json",
    lang: "en",
    apiKey,
  });

  if (country) {
    params.set("filter", `countrycode:${country}`);
  }

  const response = await fetch(`${BASE}/v1/geocode/search?${params}`, {
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Geoapify geocode error:",
      response.status,
      data.message || data.error,
    );

    throw fail(502, "Error finding city. Please check your Geoapify API key.");
  }

  const result = data.results?.[0];

  if (!result) {
    throw fail(
      400,
      `"${city}" was not found${
        country ? " in the selected country" : ""
      }. Please check spelling.`,
    );
  }

  const point = { lon: result.lon, lat: result.lat };
  cityCache.set(cacheKey, point);

  return point;
}

function first(...values) {
  const value = values.find((item) => typeof item === "string" && item.trim());

  return value ? value.split(";")[0].trim() : "";
}

function asUrl(value) {
  if (!value) return "";

  return /^https?:\/\//i.test(value) ? value : `http://${value}`;
}

function social(baseUrl, value) {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;

  const handle = String(value).replace(/^@/, "");

  return /^[A-Za-z0-9._\-/]+$/.test(handle) ? `${baseUrl}${handle}` : "";
}

function toLead(place) {
  const raw = place.datasource?.raw || {};
  const contact = place.contact || {};

  const email = first(contact.email, raw.email, raw["contact:email"]);

  const description =
    raw.description ||
    raw.note ||
    raw["description:en"] ||
    raw["description:hi"] ||
    "";

  const rating = place.rate ?? raw.rate ?? null;

  const ratingCount =
    place.review_count ??
    raw.review_count ??
    place.reviews ??
    raw.reviews ??
    null;

  return {
    placeId: place.place_id,
    name: place.name,
    address: place.formatted || place.address_line2 || "",

    phone: first(
      place.phone,
      contact.phone,
      contact.mobile,
      raw.phone,
      raw["contact:phone"],
      raw["contact:mobile"],
      raw.mobile,
    ),

    website: asUrl(
      first(
        place.website,
        contact.website,
        raw.website,
        raw["contact:website"],
        raw.url,
      ),
    ),

    emails: email ? [email.toLowerCase()] : [],

    instagram: social(
      "https://instagram.com/",
      first(raw["contact:instagram"], raw.instagram),
    ),

    facebook: social(
      "https://facebook.com/",
      first(raw["contact:facebook"], raw.facebook),
    ),

    linkedin: social(
      "https://linkedin.com/company/",
      first(raw["contact:linkedin"], raw.linkedin),
    ),

    rating:
      rating != null && Number.isFinite(Number(rating)) ? Number(rating) : null,

    ratingCount:
      ratingCount != null && Number.isFinite(Number(ratingCount))
        ? Number(ratingCount)
        : null,

    description,

    mapsUrl:
      `https://www.openstreetmap.org/?mlat=${place.lat}` +
      `&mlon=${place.lon}#map=18/${place.lat}/${place.lon}`,
  };
}

// ---------- Google Places (primary when key is set) ----------

const GOOGLE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "nextPageToken",
].join(",");

async function geocodeForGoogle(city, country) {
  const geoKey = process.env.GEOAPIFY_API_KEY;
  if (!geoKey) return null;

  try {
    return await geocodeCity(city, country, geoKey);
  } catch (err) {
    console.warn("City geocoding failed, using text query only:", err.message);
    return null;
  }
}

async function searchGoogle(category, city, opts, key) {
  const limit = resolveLimit(opts);
  const radius = Math.min(resolveRadius(opts), 50000);
  const country = resolveCountry(opts);

  const point = await geocodeForGoogle(city, country);

  const results = [];
  const seen = new Set();
  let pageToken;

  for (let page = 0; page < 5 && results.length < limit; page++) {
    const body = {
      textQuery: `${category} in ${city}`,
      pageSize: 20,
    };

    if (point) {
      body.locationBias = {
        circle: {
          center: { latitude: point.lat, longitude: point.lon },
          radius,
        },
      };
    }

    if (country) body.regionCode = country.toUpperCase();
    if (pageToken) body.pageToken = pageToken;

    const response = await fetch(GOOGLE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": GOOGLE_FIELDS,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "Google Places error:",
        response.status,
        data.error?.message,
      );

      throw fail(
        502,
        "Google Places search failed. Check the API key, billing, and that Places API (New) is enabled.",
      );
    }

    for (const p of data.places || []) {
      if (!p.id || seen.has(p.id)) continue;
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;

      seen.add(p.id);

      const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || "";
      if (opts.onlyPhone && !phone) continue;

      results.push({
        placeId: p.id,
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        phone,
        website: p.websiteUri || "",
        emails: [],
        instagram: "",
        facebook: "",
        linkedin: "",
        rating: p.rating ?? null,
        ratingCount: p.userRatingCount ?? null,
        description: "",
        mapsUrl: p.googleMapsUri || "",
      });

      if (results.length >= limit) break;
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  console.log("GOOGLE PLACES SAMPLE", JSON.stringify(results[0], null, 2));

  return results;
}

// ---------- Geoapify search (fallback) ----------

async function searchGeoapify(category, city, opts) {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw fail(
      500,
      "Neither GOOGLE_PLACES_API_KEY / PAGESPEED_API_KEY nor GEOAPIFY_API_KEY is set on the server",
    );
  }

  const categories = resolveCategories(category);

  if (!categories) {
    throw fail(
      400,
      `"${category}" is not recognized. Select a category from the dropdown or try Dentist, Gym, Salon, Restaurant, Lawyer, CA, or Interior designer.`,
    );
  }

  const limit = resolveLimit(opts);
  const radius = resolveRadius(opts);
  const country = resolveCountry(opts);

  const { lon, lat } = await geocodeCity(city, country, apiKey);

  const pool = Math.min(opts.onlyPhone ? limit * 6 : limit * 3, 500);

  const params = new URLSearchParams({
    categories: categories.join(","),
    filter: `circle:${lon},${lat},${radius}`,
    bias: `proximity:${lon},${lat}`,
    limit: String(pool),
    apiKey,
  });

  const response = await fetch(`${BASE}/v2/places?${params}`, {
    signal: AbortSignal.timeout(12000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Geoapify places error:",
      response.status,
      data.message || data.error,
    );

    throw fail(
      502,
      "Business search failed. Please check your Geoapify key or daily API limit.",
    );
  }

  const seen = new Set();
  const results = [];

  for (const feature of data.features || []) {
    const place = feature.properties || {};

    if (!place.name || !place.place_id || seen.has(place.place_id)) {
      continue;
    }

    seen.add(place.place_id);

    const lead = toLead(place);

    if (opts.onlyPhone && !lead.phone) {
      continue;
    }

    results.push(lead);

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}

// ---------- Serper.dev (Google Maps data, primary) ----------

const SERPER_URL = "https://google.serper.dev/maps";
const SERPER_ZOOM = { 3000: 15, 8000: 14, 15000: 13, 25000: 12 };

async function searchSerper(category, city, opts, key) {
  const limit = resolveLimit(opts);
  const radius = resolveRadius(opts);
  const country = resolveCountry(opts);

  const point = await geocodeForGoogle(city, country);

  const results = [];
  const seen = new Set();

  // Ek page mein ~20 places aate hain, har page 1 credit leta hai
  const maxPages = Math.min(
    Math.ceil(limit / 20) + (opts.onlyPhone ? 1 : 0),
    5,
  );

  for (let page = 1; page <= maxPages && results.length < limit; page++) {
    const body = {
      q: `${category} in ${city}`,
      hl: "en",
      page,
    };

    if (country) body.gl = String(country).toLowerCase();

    if (point) {
      body.ll = `@${point.lat},${point.lon},${SERPER_ZOOM[radius] || 14}z`;
    }

    const response = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Serper error:", response.status, data.message || data);

      throw fail(
        502,
        "Serper search failed. Check SERPER_API_KEY and remaining credits.",
      );
    }

    const places = data.places || [];
    if (!places.length) break;

    for (const p of places) {
      const id = p.placeId || p.cid || `${p.title}|${p.address}`;
      if (!p.title || seen.has(id)) continue;

      seen.add(id);

      const phone = p.phoneNumber || p.phone || "";
      if (opts.onlyPhone && !phone) continue;

      results.push({
        placeId: String(id),
        name: p.title,
        address: p.address || "",
        phone,
        website: asUrl(p.website || ""),
        emails: [],
        instagram: "",
        facebook: "",
        linkedin: "",
        rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : null,
        ratingCount: Number.isFinite(Number(p.ratingCount))
          ? Number(p.ratingCount)
          : null,
        description: p.category || "",
        mapsUrl: p.cid
          ? `https://www.google.com/maps?cid=${p.cid}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${p.title} ${p.address || ""}`,
            )}`,
      });

      if (results.length >= limit) break;
    }
  }

  console.log("SERPER SAMPLE", JSON.stringify(results[0], null, 2));

  return results;
}

// opts: { limit, country, radius, onlyPhone }
//
// Discovery only. Website / issues / social / email filters run later
// in finderRoutes.js, after enrichment.
async function searchPlaces(category, city, opts = {}) {
  const serperKey = process.env.SERPER_API_KEY;
  const googleKey =
    process.env.GOOGLE_PLACES_API_KEY || process.env.PAGESPEED_API_KEY;

  console.log("SERPER KEY LOADED:", Boolean(serperKey));

  // 1) Serper (Google Maps data, free credits)
  if (serperKey) {
    try {
      return await searchSerper(category, city, opts, serperKey);
    } catch (err) {
      console.warn("Serper failed, trying next source:", err.message);
    }
  }

  // 2) Google Places (sirf tab jab billing wali key ho)
  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      return await searchGoogle(
        category,
        city,
        opts,
        process.env.GOOGLE_PLACES_API_KEY,
      );
    } catch (err) {
      console.warn("Google failed, trying next source:", err.message);
    }
  }

  // 3) Geoapify (fallback, data kam hota hai)
  if (!process.env.GEOAPIFY_API_KEY && (serperKey || googleKey)) {
    throw fail(502, "Search sources failed. Check terminal logs.");
  }

  return searchGeoapify(category, city, opts);
}

module.exports = { searchPlaces };
