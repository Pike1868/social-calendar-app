"use strict";
/** Routes for nearby places / things to do */

const express = require("express");
const router = express.Router();
const { ensureLoggedIn } = require("../middleware/auth");
const { searchNearby, getThingsToDo } = require("../services/placesService");

/**
 * GET /places/nearby?city=Austin,TX&type=restaurants&query=
 *
 * Search for nearby places by city and type.
 * Returns { places: [...] }
 */
router.get("/nearby", ensureLoggedIn, async (req, res, next) => {
  try {
    const { city, type = "restaurants", query = "" } = req.query;

    if (!city) {
      return res.status(400).json({
        error: { message: "city query parameter is required", status: 400 },
      });
    }

    const places = await searchNearby(city, type, query);
    return res.json({ places });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /places/things-to-do?city=Austin,TX
 *
 * Get a curated mix of nearby restaurants, entertainment, parks, and bars.
 * Returns { restaurants: [...], entertainment: [...], parks: [...], bars: [...] }
 */
router.get("/things-to-do", ensureLoggedIn, async (req, res, next) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        error: { message: "city query parameter is required", status: 400 },
      });
    }

    const results = await getThingsToDo(city);
    return res.json(results);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /places/reverse-geocode?lat=27.77&lon=-82.70
 *
 * Reverse geocode coordinates to a city name via Nominatim (no CORS issues from backend).
 * Returns { city: "St. Petersburg, Florida" }
 */
router.get("/reverse-geocode", ensureLoggedIn, async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({
        error: { message: "lat and lon query parameters are required", status: 400 },
      });
    }

    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "User-Agent": "Circl-App/1.0" } }
    );
    const data = await resp.json();

    let cityName = "";
    if (data.address) {
      const city = data.address.city || data.address.town || data.address.village || "";
      const state = data.address.state || "";
      if (city) {
        cityName = state ? `${city}, ${state}` : city;
      }
    }

    return res.json({ city: cityName });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /places/city-search?q=St%20Peters&limit=10
 *
 * Search for cities by name via Nominatim (proxied to avoid CORS).
 * Returns { cities: ["St. Petersburg, Florida", ...] }
 */
router.get("/city-search", ensureLoggedIn, async (req, res, next) => {
  try {
    const { q, limit = "10" } = req.query;
    if (!q || q.length < 2) {
      return res.json({ cities: [] });
    }

    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=${limit}&featuretype=city`,
      { headers: { "User-Agent": "Circl-App/1.0" } }
    );
    const data = await resp.json();

    const cities = data
      .filter((item) => item.address && (item.address.city || item.address.town || item.address.village))
      .map((item) => {
        const city = item.address.city || item.address.town || item.address.village;
        const state = item.address.state || "";
        return state ? `${city}, ${state}` : city;
      })
      // Deduplicate
      .filter((v, i, a) => a.indexOf(v) === i);

    return res.json({ cities });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
