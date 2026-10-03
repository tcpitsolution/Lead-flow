const BASE = "https://api.geoapify.com";
const RADII = [3000, 8000, 15000, 25000]; // meters: 3, 8, 15, 25 km
const cityCache = new Map(); // cache same city to avoid wasting API credits

// user-typed category -> Geoapify categories
// full list: https://apidocs.geoapify.com/docs/places/#categories
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

const resolveCategories = (text) => {
  const t = text.toLowerCase();
  for (const [rx, cats] of CATEGORY_MAP) if (rx.test(t)) return cats;
  return null;
};

// country: 2-letter code ("in", "us"), or "" = any country
async function geocodeCity(city, country, apiKey) {
  const key = `${country}|${city.toLowerCase()}`;
  if (cityCache.has(key)) return cityCache.get(key);

  const params = new URLSearchParams({
    text: city,
    limit: "1",
    format: "json",
    lang: "en",
    apiKey,
  });
  if (country) params.set("filter", `countrycode:${country}`);

  const res = await fetch(`${BASE}/v1/geocode/search?${params}`, {
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(
      "Geoapify geocode error:",
      res.status,
      data.message || data.error,
    );
    throw fail(502, "Error finding city, please check your Geoapify key");
  }

  const r = data.results?.[0];
  if (!r)
    throw fail(
      400,
      `"${city}" not found${country ? " in this country" : ""}, please check the spelling`,
    );

  const point = { lon: r.lon, lat: r.lat };
  cityCache.set(key, point);
  return point;
}

// OSM tags sometimes have multiple values joined by ";"
const first = (...vals) => {
  const v = vals.find((x) => typeof x === "string" && x.trim());
  return v ? v.split(";")[0].trim() : "";
};
const asUrl = (v) => (v && !/^https?:\/\//i.test(v) ? `http://${v}` : v);
const social = (base, v) => {
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  return /^[A-Za-z0-9._\-/]+$/.test(handle) ? `${base}${handle}` : "";
};

function toLead(p) {
  const raw = p.datasource?.raw || {};
  const email = first(p.contact?.email, raw.email, raw["contact:email"]);
  return {
    placeId: p.place_id,
    name: p.name,
    address: p.formatted || p.address_line2 || "",
    phone: first(
      p.contact?.phone,
      raw.phone,
      raw["contact:phone"],
      raw["contact:mobile"],
      raw.mobile,
    ),
    website: asUrl(
      first(p.website, raw.website, raw["contact:website"], raw.url),
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
    linkedin: "",
    rating: null,
    ratingCount: null,
    mapsUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`,
  };
}

// opts: { limit, country, radius, onlyPhone, onlyWebsite }
// country: undefined = default from .env, "" = anywhere, "us" = that country only
async function searchPlaces(category, city, opts = {}) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw fail(500, "GEOAPIFY_API_KEY is not set on the server");

  const cats = resolveCategories(category);
  if (!cats)
    throw fail(
      400,
      `"${category}" is not recognized. Please select from the dropdown or try: Dentist, Gym, Salon, Restaurant, Lawyer, CA, Interior designer...`,
    );

  const LIMITS = [10, 20, 50, 100];
  const limit = LIMITS.includes(Number(opts.limit)) ? Number(opts.limit) : 10;
  const radius = RADII.includes(Number(opts.radius))
    ? Number(opts.radius)
    : 8000;
  const country =
    opts.country === undefined
      ? process.env.GEOAPIFY_COUNTRY || "in"
      : opts.country;

  const { lon, lat } = await geocodeCity(city, country, apiKey);

  // fetch more candidates so enough remain after filtering
  const pool = Math.min(
    opts.onlyPhone || opts.onlyWebsite ? limit * 5 : limit * 2,
    500,
  );

  const params = new URLSearchParams({
    categories: cats.join(","),
    filter: `circle:${lon},${lat},${radius}`,
    bias: `proximity:${lon},${lat}`,
    limit: String(pool),
    apiKey,
  });
  const res = await fetch(`${BASE}/v2/places?${params}`, {
    signal: AbortSignal.timeout(12000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(
      "Geoapify places error:",
      res.status,
      data.message || data.error,
    );
    throw fail(
      502,
      "Business search failed, please check your Geoapify key or daily limit",
    );
  }

  const seen = new Set();
  const out = [];
  for (const f of data.features || []) {
    const p = f.properties || {};
    if (!p.name || !p.place_id || seen.has(p.place_id)) continue;
    seen.add(p.place_id);

    const lead = toLead(p);
    if (opts.onlyPhone && !lead.phone) continue;
    if (opts.onlyWebsite && !lead.website) continue;

    out.push(lead);
    if (out.length >= limit) break;
  }
  return out;
}

module.exports = { searchPlaces };
