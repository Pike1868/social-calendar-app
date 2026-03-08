"use strict";
/** Routes for event discovery */
const express = require("express");
const router = express.Router();
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const { discoverEvents } = require("../services/eventDiscovery");

/** GET /discover/events?city=Austin&date=2026-03-15
 *
 * Discovers events from multiple sources (Ticketmaster, SeatGeek, Eventbrite).
 *
 * Required query params: city
 * Optional query params: date (defaults to today, format YYYY-MM-DD)
 *
 * Returns { events: [ { id, source, title, description, venue, city,
 *                        start_time, end_time, url, image_url }, ... ] }
 *
 * Authorization: must be logged in
 */
router.get("/events", ensureLoggedIn, async (req, res, next) => {
  try {
    const { city, date } = req.query;

    if (!city || !city.trim()) {
      throw new BadRequestError("city query parameter is required");
    }

    // Default to today if no date provided; validate format if provided
    let eventDate;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestError("date must be in YYYY-MM-DD format");
      }
      eventDate = date;
    } else {
      eventDate = new Date().toISOString().split("T")[0];
    }

    const events = await discoverEvents(city.trim(), eventDate);
    return res.status(200).json({ events });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
