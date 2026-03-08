"use strict";
/** Routes for privacy controls */
const express = require("express");
const router = express.Router();
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const SharingPreference = require("../models/sharingPreference");
const Friendship = require("../models/friendship");
const db = require("../db");

/** GET /privacy/preferences
 *
 * Returns the current user's sharing preferences merged with their friends list.
 * Friends without an explicit preference default to share_availability: true.
 *
 * Returns { sharing_enabled, preferences: [{ friend_id, share_availability, first_name, last_name, display_name, avatar_url }] }
 *
 * Authorization: must be logged in.
 */
router.get("/preferences", ensureLoggedIn, async (req, res, next) => {
  try {
    const userId = res.locals.user.id;

    // Get master toggle
    const userRes = await db.query(
      `SELECT sharing_enabled FROM users WHERE id = $1`,
      [userId]
    );
    const sharingEnabled = userRes.rows[0]?.sharing_enabled ?? true;

    // Get friends and existing preferences
    const friends = await Friendship.listFriends(userId);
    const prefs = await SharingPreference.getPreferences(userId);

    // Build a map of existing preferences
    const prefMap = new Map();
    for (const p of prefs) {
      prefMap.set(p.friend_id, p.share_availability);
    }

    // Merge: every friend gets a preference (default true if not set)
    const preferences = friends.map((f) => ({
      friend_id: f.user_id,
      first_name: f.first_name,
      last_name: f.last_name,
      display_name: f.display_name,
      avatar_url: f.avatar_url,
      share_availability: prefMap.has(f.user_id) ? prefMap.get(f.user_id) : true,
    }));

    return res.json({ sharing_enabled: sharingEnabled, preferences });
  } catch (err) {
    return next(err);
  }
});

/** PUT /privacy/preferences/:friendId
 *
 * Body: { share_availability: boolean }
 *
 * Upserts a per-friend sharing preference.
 *
 * Returns { preference: { user_id, friend_id, share_availability } }
 *
 * Authorization: must be logged in.
 */
router.put("/preferences/:friendId", ensureLoggedIn, async (req, res, next) => {
  try {
    const userId = res.locals.user.id;
    const { friendId } = req.params;
    const { share_availability } = req.body;

    if (typeof share_availability !== "boolean") {
      throw new BadRequestError("share_availability must be a boolean");
    }

    // Verify they are actually friends
    const friends = await Friendship.listFriends(userId);
    const isFriend = friends.some((f) => f.user_id === friendId);
    if (!isFriend) {
      throw new BadRequestError("Can only set preferences for accepted friends");
    }

    const preference = await SharingPreference.setPreference(
      userId,
      friendId,
      share_availability
    );

    return res.json({ preference });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
