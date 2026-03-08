"use strict";

/**
 * Places Service — fetches nearby restaurants, activities, and points of interest.
 *
 * Uses progressive enhancement with free APIs (no paid keys required):
 *  1. OpenStreetMap Nominatim (geocoding) + Overpass API (POI search)
 *  2. Yelp Fusion API fallback (if YELP_API_KEY env var is set)
 *  3. Returns empty results if neither works
 */

const YELP_KEY = process.env.YELP_API_KEY;

const NOMINATIM_HEADERS = {
  "User-Agent": "Circl-App",
};

/**
 * Geocode a city name to lat/lng using Nominatim.
 */
async function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    city
  )}&format=json&limit=1`;

  const resp = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!resp.ok) {
    throw new Error(`Nominatim geocode error: ${resp.status}`);
  }
  const data = await resp.json();
  if (!data || data.length === 0) {
    throw new Error(`Could not geocode city: ${city}`);
  }
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

/**
 * Overpass API type mappings.
 * Each category maps to one or more Overpass tag filters.
 */
const OVERPASS_TYPE_MAP = {
  restaurants: ['node["amenity"="restaurant"]'],
  bars: ['node["amenity"="bar"]'],
  parks: ['way["leisure"="park"]', 'node["leisure"="park"]'],
  entertainment: [
    'node["amenity"="cinema"]',
    'node["amenity"="theatre"]',
    'node["tourism"="museum"]',
  ],
};

/**
 * Category labels for Overpass results based on OSM tags.
 */
function getCategoryFromTags(tags) {
  if (!tags) return "";
  if (tags.amenity === "restaurant") return "Restaurant";
  if (tags.amenity === "bar") return "Bar";
  if (tags.leisure === "park") return "Park";
  if (tags.amenity === "cinema") return "Cinema";
  if (tags.amenity === "theatre") return "Theatre";
  if (tags.tourism === "museum") return "Museum";
  return tags.amenity || tags.leisure || tags.tourism || "";
}

/**
 * Normalize an Overpass element to the common place schema.
 */
function normalizeOverpassPlace(element, city) {
  const tags = element.tags || {};
  const lat = element.lat || element.center?.lat || null;
  const lng = element.lon || element.center?.lon || null;

  return {
    id: `osm-${element.id}`,
    source: "openstreetmap",
    name: tags.name || "Unnamed Place",
    category: getCategoryFromTags(tags),
    rating: null,
    price_level: null,
    address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]]
      .filter(Boolean)
      .join(" ") || "",
    city: city,
    image_url: null, // OSM doesn't provide photos
    url: tags.website || (lat && lng ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}` : null),
    lat,
    lng,
  };
}

/**
 * Search nearby POIs via Overpass API.
 */
async function searchOverpass(city, type) {
  const { lat, lng } = await geocodeCity(city);

  const filters = OVERPASS_TYPE_MAP[type];
  if (!filters) return [];

  // Build Overpass query with all filters for this type
  const unionParts = filters
    .map((f) => `${f}(around:5000,${lat},${lng});`)
    .join("");
  const query = `[out:json];(${unionParts});out body 10;`;

  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!resp.ok) {
    throw new Error(`Overpass API error: ${resp.status}`);
  }

  const data = await resp.json();
  const elements = data.elements || [];

  // Filter out unnamed places and normalize
  return elements
    .filter((el) => el.tags && el.tags.name)
    .slice(0, 10)
    .map((el) => normalizeOverpassPlace(el, city));
}

function normalizeYelpPlace(biz) {
  return {
    id: biz.id || "",
    source: "yelp",
    name: biz.name || "",
    category:
      biz.categories && biz.categories.length > 0
        ? biz.categories[0].title
        : "",
    rating: biz.rating || null,
    price_level: biz.price ? biz.price.length : null,
    address: biz.location
      ? biz.location.display_address?.join(", ") || ""
      : "",
    city: biz.location?.city || "",
    image_url: biz.image_url || null,
    url: biz.url || null,
    lat: biz.coordinates?.latitude || null,
    lng: biz.coordinates?.longitude || null,
  };
}

/**
 * Search Yelp Fusion API.
 */
async function searchYelp(city, term) {
  const url = new URL("https://api.yelp.com/v3/businesses/search");
  url.searchParams.set("location", city);
  url.searchParams.set("term", term);
  url.searchParams.set("limit", "10");
  url.searchParams.set("sort_by", "best_match");

  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${YELP_KEY}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Yelp API error: ${resp.status}`);
  }

  const data = await resp.json();
  return (data.businesses || []).map(normalizeYelpPlace);
}

/**
 * Search nearby places using the best available provider.
 *
 * @param {string} city - City name (e.g. "Austin, TX")
 * @param {string} type - Category type: 'restaurants', 'things to do', 'bars', 'parks', 'entertainment'
 * @param {string} [query] - Optional custom search query
 * @returns {Promise<Array>} Normalized place results
 */
async function searchNearby(city, type = "restaurants", query = "") {
  if (!city) return [];

  // Map friendly type names to search terms (used for Yelp fallback)
  const typeMap = {
    restaurants: "restaurants",
    "things to do": "things to do activities",
    bars: "bars nightlife",
    parks: "parks outdoor recreation",
    entertainment: "entertainment fun activities",
  };

  const searchTerm = query || typeMap[type] || type;

  // Normalize type for Overpass lookup
  const overpassType = type === "things to do" ? "entertainment" : type;

  // Try Overpass (free, no key needed)
  if (OVERPASS_TYPE_MAP[overpassType]) {
    try {
      const results = await searchOverpass(city, overpassType);
      if (results.length > 0) return results;
    } catch (err) {
      console.error("Overpass API error, trying Yelp fallback:", err.message);
    }
  }

  // Try Yelp fallback
  if (YELP_KEY) {
    try {
      return await searchYelp(city, searchTerm);
    } catch (err) {
      console.error("Yelp API error:", err.message);
    }
  }

  // No results available
  console.warn(
    "No places found. Overpass returned no results and YELP_API_KEY is not set."
  );
  return [];
}

/**
 * Get a curated mix of places across multiple categories.
 *
 * @param {string} city - City name
 * @returns {Promise<Object>} { restaurants, entertainment, parks, bars }
 */
async function getThingsToDo(city) {
  if (!city) {
    return { restaurants: [], entertainment: [], parks: [], bars: [] };
  }

  const categories = ["restaurants", "entertainment", "parks", "bars"];

  const results = await Promise.allSettled(
    categories.map((cat) => searchNearby(city, cat))
  );

  const output = {};
  categories.forEach((cat, i) => {
    output[cat] =
      results[i].status === "fulfilled" ? results[i].value : [];
  });

  return output;
}

module.exports = {
  searchNearby,
  getThingsToDo,
};
