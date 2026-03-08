"use strict";
const db = require("../db");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../expressError");

class Friendship {
  /** Send a friend request from requesterId to user with given email.
   *
   * Returns { id, requester_id, addressee_id, status, created_at }
   *
   * Throws BadRequestError if self-request, already exists, or user not found.
   */
  static async sendRequest(requesterId, addresseeEmail) {
    // Look up addressee by email
    const userRes = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [addresseeEmail]
    );
    const addressee = userRes.rows[0];
    if (!addressee) throw new NotFoundError(`No user found with email: ${addresseeEmail}`);

    const addresseeId = addressee.id;

    if (requesterId === addresseeId) {
      throw new BadRequestError("Cannot send friend request to yourself");
    }

    // Check if friendship already exists in either direction
    const existing = await db.query(
      `SELECT id, status FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [requesterId, addresseeId]
    );

    if (existing.rows.length > 0) {
      const f = existing.rows[0];
      if (f.status === "accepted") throw new BadRequestError("Already friends");
      if (f.status === "pending") throw new BadRequestError("Friend request already pending");
      if (f.status === "blocked") throw new BadRequestError("Cannot send friend request");
    }

    const result = await db.query(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, requester_id, addressee_id, status, created_at`,
      [requesterId, addresseeId]
    );

    return result.rows[0];
  }

  /** Accept a pending friend request.
   *
   * Only the addressee can accept.
   *
   * Returns { id, requester_id, addressee_id, status, updated_at }
   */
  static async accept(friendshipId, userId) {
    const result = await db.query(
      `UPDATE friendships
       SET status = 'accepted'
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
       RETURNING id, requester_id, addressee_id, status, updated_at`,
      [friendshipId, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No pending friend request found with id: ${friendshipId}`);
    }

    return result.rows[0];
  }

  /** Decline a pending friend request.
   *
   * Only the addressee can decline. Deletes the request.
   *
   * Returns { id }
   */
  static async decline(friendshipId, userId) {
    const result = await db.query(
      `DELETE FROM friendships
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
       RETURNING id`,
      [friendshipId, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No pending friend request found with id: ${friendshipId}`);
    }

    return result.rows[0];
  }

  /** Remove an accepted friendship. Either party can remove.
   *
   * Returns { id }
   */
  static async remove(friendshipId, userId) {
    const result = await db.query(
      `DELETE FROM friendships
       WHERE id = $1
         AND (requester_id = $2 OR addressee_id = $2)
       RETURNING id`,
      [friendshipId, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No friendship found with id: ${friendshipId}`);
    }

    return result.rows[0];
  }

  /** List all accepted friends for a user.
   *
   * Returns [{ friendship_id, user_id, email, first_name, last_name, display_name, avatar_url }, ...]
   */
  static async listFriends(userId) {
    const result = await db.query(
      `SELECT f.id AS friendship_id,
              u.id AS user_id,
              u.email,
              u.first_name,
              u.last_name,
              u.display_name,
              u.avatar_url
       FROM friendships f
       JOIN users u ON u.id = CASE
         WHEN f.requester_id = $1 THEN f.addressee_id
         ELSE f.requester_id
       END
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'accepted'
       ORDER BY u.first_name, u.last_name`,
      [userId]
    );

    return result.rows;
  }

  /** List pending incoming friend requests for a user.
   *
   * Returns [{ friendship_id, user_id, email, first_name, last_name, display_name, avatar_url, created_at }, ...]
   */
  static async listPendingRequests(userId) {
    const result = await db.query(
      `SELECT f.id AS friendship_id,
              u.id AS user_id,
              u.email,
              u.first_name,
              u.last_name,
              u.display_name,
              u.avatar_url,
              f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = $1
         AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /** Get a friendship by ID.
   *
   * Returns { id, requester_id, addressee_id, status, created_at, updated_at }
   */
  static async get(friendshipId) {
    const result = await db.query(
      `SELECT id, requester_id, addressee_id, status, created_at, updated_at
       FROM friendships WHERE id = $1`,
      [friendshipId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No friendship found with id: ${friendshipId}`);
    }

    return result.rows[0];
  }
}

module.exports = Friendship;
