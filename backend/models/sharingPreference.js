"use strict";
const db = require("../db");
const { NotFoundError } = require("../expressError");

class SharingPreference {
  /** Get all sharing preferences for a user.
   *
   * Returns [{ friend_id, share_availability, first_name, last_name, display_name, avatar_url }, ...]
   */
  static async getPreferences(userId) {
    const result = await db.query(
      `SELECT sp.friend_id,
              sp.share_availability,
              u.first_name,
              u.last_name,
              u.display_name,
              u.avatar_url
       FROM sharing_preferences sp
       JOIN users u ON u.id = sp.friend_id
       WHERE sp.user_id = $1
       ORDER BY u.first_name, u.last_name`,
      [userId]
    );
    return result.rows;
  }

  /** Upsert a per-friend sharing preference.
   *
   * Returns { user_id, friend_id, share_availability }
   */
  static async setPreference(userId, friendId, shareAvailability) {
    const result = await db.query(
      `INSERT INTO sharing_preferences (user_id, friend_id, share_availability)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, friend_id)
       DO UPDATE SET share_availability = $3
       RETURNING user_id, friend_id, share_availability`,
      [userId, friendId, shareAvailability]
    );
    return result.rows[0];
  }

  /** Check if viewerId can view ownerId's availability.
   *
   * Checks: master toggle (sharing_enabled) AND per-friend preference.
   * If no per-friend pref exists, defaults to true (allowed) when master is on.
   *
   * Returns boolean
   */
  static async canViewAvailability(ownerId, viewerId) {
    // Check master toggle
    const userRes = await db.query(
      `SELECT sharing_enabled FROM users WHERE id = $1`,
      [ownerId]
    );

    if (!userRes.rows[0]) throw new NotFoundError(`No user with id: ${ownerId}`);

    if (!userRes.rows[0].sharing_enabled) return false;

    // Check per-friend preference (defaults to true if no row exists)
    const prefRes = await db.query(
      `SELECT share_availability FROM sharing_preferences
       WHERE user_id = $1 AND friend_id = $2`,
      [ownerId, viewerId]
    );

    if (prefRes.rows.length === 0) return true;
    return prefRes.rows[0].share_availability;
  }
}

module.exports = SharingPreference;
