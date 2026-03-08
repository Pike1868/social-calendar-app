"use strict";
/** Routes for event discovery */
const express = require("express");
const router = express.Router();
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const { discoverEvents } = require("../services/eventDiscovery");
const { detectTravel } = require("../services/travelDetection");
const User = require("../models/user");
const Friendship = require("../models/friendship");
const { google } = require("googleapis");

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

/** GET /discover/travel-matches?userId=xxx
 *
 * Detects upcoming travel from the user's Google Calendar events,
 * then cross-references with friends' home cities to find matches.
 *
 * Returns { travels: [{ city, startDate, endDate }],
 *           matches: [{ city, startDate, endDate,
 *                       friends: [{ user_id, first_name, last_name, display_name, avatar_url }] }] }
 *
 * Authorization: must be logged in.
 */
router.get("/travel-matches", ensureLoggedIn, async (req, res, next) => {
  try {
    const userId = res.locals.user.id;

    // Fetch user to get Google tokens
    const user = await User.findById(userId);

    if (!user.access_token) {
      throw new BadRequestError("Google Calendar not connected");
    }

    // Fetch upcoming events from Google Calendar (next 90 days)
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.access_token });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 90);

    const eventsRes = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const googleEvents = eventsRes.data.items || [];

    // Detect travel
    const travels = detectTravel(googleEvents);

    if (travels.length === 0) {
      return res.json({ travels: [], matches: [] });
    }

    // Get friends with their home cities
    const friends = await Friendship.listFriends(userId);

    // Cross-reference: find friends whose home_city matches a travel destination
    const matches = [];
    for (const travel of travels) {
      const travelCityLower = travel.city.toLowerCase();
      const matchingFriends = [];

      for (const friend of friends) {
        // Look up the friend's home_city from the users table
        try {
          const friendData = await User.findById(friend.user_id);
          if (
            friendData.home_city &&
            friendData.home_city.toLowerCase().includes(travelCityLower)
          ) {
            matchingFriends.push({
              user_id: friend.user_id,
              first_name: friend.first_name,
              last_name: friend.last_name,
              display_name: friend.display_name,
              avatar_url: friend.avatar_url,
            });
          }
        } catch (err) {
          // Skip friends that can't be looked up
          continue;
        }
      }

      if (matchingFriends.length > 0) {
        matches.push({
          city: travel.city,
          startDate: travel.startDate,
          endDate: travel.endDate,
          friends: matchingFriends,
        });
      }
    }

    return res.json({ travels, matches });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
