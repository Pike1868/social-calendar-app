"use strict";

/**
 * Travel Detection Service (US-018)
 *
 * Scans Google Calendar events for travel-related keywords and extracts
 * destination cities from event titles and locations.
 */

const TRAVEL_KEYWORDS = [
  "flight",
  "hotel",
  "trip",
  "travel",
  "visiting",
  "airport",
  "fly to",
  "flying to",
  "road trip",
  "vacation",
];

const TRAVEL_PATTERN = new RegExp(
  `\\b(${TRAVEL_KEYWORDS.join("|")})\\b`,
  "i"
);

/**
 * Try to extract a destination city from an event title or location.
 *
 * Looks for patterns like:
 *   "Flight to Austin"
 *   "Trip to New York"
 *   "Visiting Chicago"
 *   "Hotel in Denver"
 *
 * Falls back to the event location field if no city extracted from title.
 *
 * @param {string} title
 * @param {string} location
 * @returns {string|null} extracted city or null
 */
function extractCity(title, location) {
  if (title) {
    // "Flight to Austin", "Trip to New York City"
    const toMatch = title.match(/\b(?:to|in|at)\s+([A-Z][A-Za-z\s]{1,30})/);
    if (toMatch) {
      return toMatch[1].trim();
    }

    // "Visiting Chicago"
    const visitMatch = title.match(/\b(?:visiting)\s+([A-Z][A-Za-z\s]{1,30})/i);
    if (visitMatch) {
      return visitMatch[1].trim();
    }
  }

  // Fall back to location field — take the city part (often "City, State" or "City, Country")
  if (location) {
    const parts = location.split(",");
    if (parts.length > 0) {
      const city = parts[0].trim();
      // Only use if it looks like a city name (starts with uppercase, reasonable length)
      if (city.length > 1 && city.length < 50 && /^[A-Z]/.test(city)) {
        return city;
      }
    }
  }

  return null;
}

/**
 * Detect travel from a list of Google Calendar events.
 *
 * @param {Array} googleEvents - Array of Google Calendar event objects
 *   Each should have: { summary, location, start: { dateTime|date }, end: { dateTime|date } }
 * @returns {Array<{ city: string, startDate: string, endDate: string }>}
 */
function detectTravel(googleEvents) {
  if (!Array.isArray(googleEvents)) return [];

  const travels = [];

  for (const event of googleEvents) {
    const title = event.summary || "";
    const location = event.location || "";
    const combined = `${title} ${location}`;

    if (!TRAVEL_PATTERN.test(combined)) continue;

    const city = extractCity(title, location);
    if (!city) continue;

    const startDate =
      event.start?.dateTime?.split("T")[0] ||
      event.start?.date ||
      null;
    const endDate =
      event.end?.dateTime?.split("T")[0] ||
      event.end?.date ||
      null;

    if (!startDate) continue;

    travels.push({
      city,
      startDate,
      endDate: endDate || startDate,
    });
  }

  // Deduplicate by city + overlapping dates
  const merged = [];
  for (const t of travels) {
    const existing = merged.find(
      (m) => m.city.toLowerCase() === t.city.toLowerCase()
    );
    if (existing) {
      // Extend date range
      if (t.startDate < existing.startDate) existing.startDate = t.startDate;
      if (t.endDate > existing.endDate) existing.endDate = t.endDate;
    } else {
      merged.push({ ...t });
    }
  }

  return merged;
}

module.exports = { detectTravel, extractCity };
