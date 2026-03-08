"use strict";

/**
 * Event Discovery Service
 *
 * Aggregates events from multiple sources (Ticketmaster, SeatGeek, Eventbrite),
 * normalizes them to a common schema, and deduplicates by name+venue similarity.
 */

const TICKETMASTER_API_KEY =
  process.env.TICKETMASTER_API_KEY || process.env.REACT_APP_TICKETMASTER_API_KEY;
const SEATGEEK_CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN;

/**
 * Fetch events from Ticketmaster Discovery API.
 * @param {string} city
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} normalized events
 */
async function fetchTicketmasterEvents(city, date) {
  if (!TICKETMASTER_API_KEY) {
    console.warn("TICKETMASTER_API_KEY not set — skipping Ticketmaster source");
    return [];
  }

  const params = new URLSearchParams({
    apikey: TICKETMASTER_API_KEY,
    city,
    startDateTime: `${date}T00:00:00Z`,
    sort: "date,asc",
    size: "50",
  });

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Ticketmaster API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    const events = data?._embedded?.events || [];

    return events.map((e) => ({
      id: `tm-${e.id}`,
      source: "ticketmaster",
      title: e.name || "",
      description: e.info || e.pleaseNote || "",
      venue: e._embedded?.venues?.[0]?.name || "",
      city: e._embedded?.venues?.[0]?.city?.name || city,
      start_time: e.dates?.start?.dateTime || null,
      end_time: e.dates?.end?.dateTime || null,
      url: e.url || "",
      image_url: e.images?.[0]?.url || "",
    }));
  } catch (err) {
    console.error("Ticketmaster fetch failed:", err.message);
    return [];
  }
}

/**
 * Fetch events from SeatGeek API.
 * @param {string} city
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} normalized events
 */
async function fetchSeatGeekEvents(city, date) {
  if (!SEATGEEK_CLIENT_ID) {
    console.warn("SEATGEEK_CLIENT_ID not set — skipping SeatGeek source");
    return [];
  }

  const params = new URLSearchParams({
    "venue.city": city,
    "datetime_utc.gte": `${date}T00:00:00`,
    client_id: SEATGEEK_CLIENT_ID,
    per_page: "50",
  });

  const url = `https://api.seatgeek.com/2/events?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`SeatGeek API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    const events = data?.events || [];

    return events.map((e) => ({
      id: `sg-${e.id}`,
      source: "seatgeek",
      title: e.title || "",
      description: e.description || "",
      venue: e.venue?.name || "",
      city: e.venue?.city || city,
      start_time: e.datetime_utc ? `${e.datetime_utc}Z` : null,
      end_time: e.datetime_utc_end ? `${e.datetime_utc_end}Z` : null,
      url: e.url || "",
      image_url: e.performers?.[0]?.image || "",
    }));
  } catch (err) {
    console.error("SeatGeek fetch failed:", err.message);
    return [];
  }
}

/**
 * Fetch events from Eventbrite API.
 * @param {string} city
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} normalized events
 */
async function fetchEventbriteEvents(city, date) {
  if (!EVENTBRITE_TOKEN) {
    console.warn("EVENTBRITE_TOKEN not set — skipping Eventbrite source");
    return [];
  }

  const params = new URLSearchParams({
    "location.address": city,
    "start_date.range_start": `${date}T00:00:00`,
    token: EVENTBRITE_TOKEN,
  });

  const url = `https://www.eventbriteapi.com/v3/events/search/?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Eventbrite API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    const events = data?.events || [];

    return events.map((e) => ({
      id: `eb-${e.id}`,
      source: "eventbrite",
      title: e.name?.text || "",
      description: e.description?.text || "",
      venue: e.venue?.name || "",
      city: e.venue?.address?.city || city,
      start_time: e.start?.utc || null,
      end_time: e.end?.utc || null,
      url: e.url || "",
      image_url: e.logo?.original?.url || "",
    }));
  } catch (err) {
    console.error("Eventbrite fetch failed:", err.message);
    return [];
  }
}

/**
 * Simple similarity check between two strings.
 * Returns a value between 0 and 1.
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();
  if (strA === strB) return 1;

  // Check if one contains the other
  if (strA.includes(strB) || strB.includes(strA)) return 0.8;

  // Simple token overlap ratio
  const tokensA = new Set(strA.split(/\s+/));
  const tokensB = new Set(strB.split(/\s+/));
  const intersection = [...tokensA].filter((t) => tokensB.has(t));
  const union = new Set([...tokensA, ...tokensB]);
  return intersection.length / union.size;
}

/**
 * Deduplicate events by title + venue similarity.
 * Keeps the first occurrence when duplicates are found.
 */
function deduplicateEvents(events) {
  const unique = [];
  for (const event of events) {
    const isDup = unique.some(
      (existing) =>
        similarity(existing.title, event.title) > 0.7 &&
        similarity(existing.venue, event.venue) > 0.5
    );
    if (!isDup) {
      unique.push(event);
    }
  }
  return unique;
}

/**
 * Discover events from all sources in parallel.
 * Normalizes to common schema and deduplicates.
 * @param {string} city
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} deduplicated, normalized events
 */
async function discoverEvents(city, date) {
  const results = await Promise.allSettled([
    fetchTicketmasterEvents(city, date),
    fetchSeatGeekEvents(city, date),
    fetchEventbriteEvents(city, date),
  ]);

  const allEvents = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allEvents.push(...result.value);
    } else {
      console.error("Event source failed:", result.reason);
    }
  }

  return deduplicateEvents(allEvents);
}

module.exports = {
  fetchTicketmasterEvents,
  fetchSeatGeekEvents,
  fetchEventbriteEvents,
  discoverEvents,
};
