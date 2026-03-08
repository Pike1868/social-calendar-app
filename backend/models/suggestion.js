"use strict";
const db = require("../db");
const { NotFoundError } = require("../expressError");

class Suggestion {
  /** Create a new suggestion.
   *
   * Returns { id, user_id, type, title, body, metadata, status, created_at, expires_at }
   */
  static async create({ user_id, type, title, body, metadata, expires_at }) {
    const result = await db.query(
      `INSERT INTO suggestions (user_id, type, title, body, metadata, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, type, title, body, metadata, status, created_at, expires_at`,
      [user_id, type, title, body || null, metadata ? JSON.stringify(metadata) : null, expires_at || null]
    );

    return result.rows[0];
  }

  /** List active (non-expired, non-dismissed) suggestions for a user.
   *
   * Returns [{ id, user_id, type, title, body, metadata, status, created_at, expires_at }, ...]
   */
  static async listByUser(userId) {
    const result = await db.query(
      `SELECT id, user_id, type, title, body, metadata, status, created_at, expires_at
       FROM suggestions
       WHERE user_id = $1
         AND status != 'dismissed'
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /** Dismiss a suggestion. Only the owning user can dismiss.
   *
   * Returns { id, status }
   *
   * Throws NotFoundError if not found or not owned by user.
   */
  static async dismiss(id, userId) {
    const result = await db.query(
      `UPDATE suggestions
       SET status = 'dismissed'
       WHERE id = $1 AND user_id = $2
       RETURNING id, status`,
      [id, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No suggestion found with id: ${id}`);
    }

    return result.rows[0];
  }

  /** Mark a suggestion as acted on. Only the owning user can mark.
   *
   * Returns { id, status }
   *
   * Throws NotFoundError if not found or not owned by user.
   */
  static async markActed(id, userId) {
    const result = await db.query(
      `UPDATE suggestions
       SET status = 'acted_on'
       WHERE id = $1 AND user_id = $2
       RETURNING id, status`,
      [id, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No suggestion found with id: ${id}`);
    }

    return result.rows[0];
  }

  /** Delete all expired suggestions.
   *
   * Returns count of deleted rows.
   */
  static async deleteExpired() {
    const result = await db.query(
      `DELETE FROM suggestions
       WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`
    );

    return result.rowCount;
  }
}

module.exports = Suggestion;
