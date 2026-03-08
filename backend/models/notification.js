"use strict";
const db = require("../db");
const { NotFoundError } = require("../expressError");

class Notification {
  /** Create a new notification.
   *
   * Returns { id, user_id, type, title, body, metadata, read, created_at }
   */
  static async create({ user_id, type, title, body, metadata }) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, type, title, body, metadata, read, created_at`,
      [user_id, type, title, body || null, metadata ? JSON.stringify(metadata) : null]
    );

    return result.rows[0];
  }

  /** List recent notifications for a user.
   *
   * Returns [{ id, user_id, type, title, body, metadata, read, created_at }, ...]
   */
  static async listByUser(userId, limit = 50) {
    const result = await db.query(
      `SELECT id, user_id, type, title, body, metadata, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /** Mark a single notification as read. Only the owning user can mark.
   *
   * Returns { id, read }
   *
   * Throws NotFoundError if not found or not owned by user.
   */
  static async markRead(id, userId) {
    const result = await db.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, read`,
      [id, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No notification found with id: ${id}`);
    }

    return result.rows[0];
  }

  /** Mark all notifications as read for a user.
   *
   * Returns count of updated rows.
   */
  static async markAllRead(userId) {
    const result = await db.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    return result.rowCount;
  }

  /** Get count of unread notifications for a user.
   *
   * Returns { count: number }
   */
  static async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    return result.rows[0].count;
  }
}

module.exports = Notification;
