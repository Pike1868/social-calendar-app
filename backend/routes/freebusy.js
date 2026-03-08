"use strict";

const express = require("express");
const router = new express.Router();
const jsonschema = require("jsonschema");
const db = require("../db");
const User = require("../models/user");
const { ensureLoggedIn } = require("../middleware/auth");
const {
  BadRequestError,
  ForbiddenError,
} = require("../expressError");
const { fetchFreeBusyForUser } = require("../services/googleFreeBusy");
const freebusySchema = require("../schemas/freebusy.json");

/**
 * POST /freebusy
 *
 * Body: { friendIds: ["id1", "id2"], timeMin: "ISO date", timeMax: "ISO date" }
 *
 * Returns: { availability: { [friendId]: { busy: [{start, end}], displayName } } }
 *
 * Authorization: must be logged in.
 * Privacy: only returns free/busy blocks, never event titles or details.
 * Checks: friendship must be accepted AND friend must have sharing_opt_in = true.
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, freebusySchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const userId = res.locals.user.id;
    const { friendIds, timeMin, timeMax } = req.body;

    // Validate date range
    const minDate = new Date(timeMin);
    const maxDate = new Date(timeMax);
    if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      throw new BadRequestError("timeMin and timeMax must be valid ISO 8601 dates");
    }
    if (maxDate <= minDate) {
      throw new BadRequestError("timeMax must be after timeMin");
    }

    // Verify accepted friendships for all requested IDs in one query
    const friendshipCheck = await db.query(
      `SELECT
         CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS friend_id
       FROM friendships f
       WHERE f.status = 'accepted'
         AND (
           (f.requester_id = $1 AND f.addressee_id = ANY($2::varchar[]))
           OR
           (f.addressee_id = $1 AND f.requester_id = ANY($2::varchar[]))
         )`,
      [userId, friendIds]
    );

    const acceptedFriendIds = new Set(friendshipCheck.rows.map(r => r.friend_id));

    // Fetch FreeBusy data for each friend concurrently
    const availability = {};

    const fetchPromises = friendIds.map(async (friendId) => {
      // Check friendship status
      if (!acceptedFriendIds.has(friendId)) {
        availability[friendId] = { error: "Not an accepted friend" };
        return;
      }

      try {
        // Fetch user data (includes decrypted tokens)
        const friendData = await User.findById(friendId);

        // Check sharing opt-in
        if (!friendData.sharing_opt_in) {
          availability[friendId] = { error: "User has not opted in to sharing" };
          return;
        }

        // Check that friend has Google tokens
        if (!friendData.access_token) {
          availability[friendId] = { error: "User has no Google Calendar connected" };
          return;
        }

        // Fetch FreeBusy data
        const busy = await fetchFreeBusyForUser(
          friendData,
          timeMin,
          timeMax,
          friendData.time_zone || "UTC"
        );

        availability[friendId] = {
          busy,
          displayName: friendData.display_name || `${friendData.first_name} ${friendData.last_name}`,
        };
      } catch (err) {
        console.error(`FreeBusy error for user ${friendId}:`, err.message);
        availability[friendId] = { error: "Unable to fetch availability" };
      }
    });

    await Promise.all(fetchPromises);

    return res.json({ availability });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /freebusy
 *
 * Query params:
 *   friendIds - comma-separated list of friend user IDs
 *   timeMin   - ISO 8601 datetime (start of range)
 *   timeMax   - ISO 8601 datetime (end of range)
 *   timeZone  - IANA timezone string (optional, defaults to UTC)
 *
 * Returns: { results: { [friendId]: { busy: [{start, end}] } | { error: string } } }
 *
 * Authorization: must be logged in.
 * Privacy: only returns free/busy blocks, never event titles or details.
 * Checks: friendship must be accepted AND friend must have sharing_opt_in = true.
 */
router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const { friendIds, timeMin, timeMax, timeZone } = req.query;

    // Validate required params
    if (!friendIds || !timeMin || !timeMax) {
      throw new BadRequestError("friendIds, timeMin, and timeMax are required query parameters");
    }

    const ids = friendIds.split(",").map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      throw new BadRequestError("At least one friendId is required");
    }
    if (ids.length > 20) {
      throw new BadRequestError("Maximum 20 friend IDs per request");
    }

    // Validate date range
    const minDate = new Date(timeMin);
    const maxDate = new Date(timeMax);
    if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      throw new BadRequestError("timeMin and timeMax must be valid ISO 8601 dates");
    }
    if (maxDate <= minDate) {
      throw new BadRequestError("timeMax must be after timeMin");
    }

    // Verify accepted friendships for all requested IDs in one query
    const friendshipCheck = await db.query(
      `SELECT
         CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS friend_id
       FROM friendships f
       WHERE f.status = 'accepted'
         AND (
           (f.requester_id = $1 AND f.addressee_id = ANY($2::varchar[]))
           OR
           (f.addressee_id = $1 AND f.requester_id = ANY($2::varchar[]))
         )`,
      [userId, ids]
    );

    const acceptedFriendIds = new Set(friendshipCheck.rows.map(r => r.friend_id));

    // Fetch FreeBusy data for each friend concurrently
    const results = {};

    const fetchPromises = ids.map(async (friendId) => {
      // Check friendship status
      if (!acceptedFriendIds.has(friendId)) {
        results[friendId] = { error: "Not an accepted friend" };
        return;
      }

      try {
        // Fetch user data (includes decrypted tokens)
        const friendData = await User.findById(friendId);

        // Check sharing opt-in
        if (!friendData.sharing_opt_in) {
          results[friendId] = { error: "User has not opted in to sharing" };
          return;
        }

        // Check that friend has Google tokens
        if (!friendData.access_token) {
          results[friendId] = { error: "User has no Google Calendar connected" };
          return;
        }

        // Fetch FreeBusy data
        const busy = await fetchFreeBusyForUser(
          friendData,
          timeMin,
          timeMax,
          timeZone || friendData.time_zone || "UTC"
        );

        results[friendId] = { busy };
      } catch (err) {
        console.error(`FreeBusy error for user ${friendId}:`, err.message);
        results[friendId] = { error: "Unable to fetch availability" };
      }
    });

    await Promise.all(fetchPromises);

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
