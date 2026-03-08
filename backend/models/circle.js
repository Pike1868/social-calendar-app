"use strict";
const db = require("../db");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../expressError");

class Circle {
  /** Create a new circle.
   *
   * Returns { id, user_id, name, created_at }
   */
  static async create(userId, name) {
    const result = await db.query(
      `INSERT INTO circles (user_id, name)
       VALUES ($1, $2)
       RETURNING id, user_id, name, created_at`,
      [userId, name]
    );

    return result.rows[0];
  }

  /** List all circles for a user, with members.
   *
   * Returns [{ id, name, created_at, members: [{ user_id, email, first_name, last_name, display_name, avatar_url }] }, ...]
   */
  static async listByUser(userId) {
    const circlesRes = await db.query(
      `SELECT id, name, created_at
       FROM circles
       WHERE user_id = $1
       ORDER BY name`,
      [userId]
    );

    const circles = circlesRes.rows;

    // Fetch members for all circles in one query
    if (circles.length > 0) {
      const circleIds = circles.map((c) => c.id);
      const membersRes = await db.query(
        `SELECT cm.circle_id,
                u.id AS user_id,
                u.email,
                u.first_name,
                u.last_name,
                u.display_name,
                u.avatar_url
         FROM circle_members cm
         JOIN users u ON u.id = cm.member_id
         WHERE cm.circle_id = ANY($1)
         ORDER BY u.first_name, u.last_name`,
        [circleIds]
      );

      const membersByCircle = {};
      for (const m of membersRes.rows) {
        if (!membersByCircle[m.circle_id]) membersByCircle[m.circle_id] = [];
        membersByCircle[m.circle_id].push({
          user_id: m.user_id,
          email: m.email,
          first_name: m.first_name,
          last_name: m.last_name,
          display_name: m.display_name,
          avatar_url: m.avatar_url,
        });
      }

      for (const circle of circles) {
        circle.members = membersByCircle[circle.id] || [];
      }
    }

    return circles;
  }

  /** Get a single circle by ID. Verifies ownership.
   *
   * Returns { id, user_id, name, created_at }
   *
   * Throws NotFoundError if not found.
   * Throws ForbiddenError if not the owner.
   */
  static async get(circleId, userId) {
    const result = await db.query(
      `SELECT id, user_id, name, created_at
       FROM circles WHERE id = $1`,
      [circleId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No circle found with id: ${circleId}`);
    }

    if (result.rows[0].user_id !== userId) {
      throw new ForbiddenError("Not authorized to access this circle");
    }

    return result.rows[0];
  }

  /** Add a member to a circle. Must be an accepted friend.
   *
   * Returns { circle_id, member_id, added_at }
   */
  static async addMember(circleId, memberId, ownerId) {
    // Verify circle ownership
    await Circle.get(circleId, ownerId);

    // Verify they are friends
    const friendCheck = await db.query(
      `SELECT id FROM friendships
       WHERE ((requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1))
         AND status = 'accepted'`,
      [ownerId, memberId]
    );

    if (!friendCheck.rows[0]) {
      throw new BadRequestError("User must be an accepted friend to add to circle");
    }

    // Check if already a member
    const dupCheck = await db.query(
      `SELECT circle_id FROM circle_members
       WHERE circle_id = $1 AND member_id = $2`,
      [circleId, memberId]
    );

    if (dupCheck.rows[0]) {
      throw new BadRequestError("User is already a member of this circle");
    }

    const result = await db.query(
      `INSERT INTO circle_members (circle_id, member_id)
       VALUES ($1, $2)
       RETURNING circle_id, member_id, added_at`,
      [circleId, memberId]
    );

    return result.rows[0];
  }

  /** Remove a member from a circle.
   *
   * Returns { circle_id, member_id }
   */
  static async removeMember(circleId, memberId, ownerId) {
    // Verify circle ownership
    await Circle.get(circleId, ownerId);

    const result = await db.query(
      `DELETE FROM circle_members
       WHERE circle_id = $1 AND member_id = $2
       RETURNING circle_id, member_id`,
      [circleId, memberId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError("Member not found in circle");
    }

    return result.rows[0];
  }

  /** Delete a circle.
   *
   * Returns { id }
   */
  static async remove(circleId, userId) {
    // Verify ownership
    await Circle.get(circleId, userId);

    const result = await db.query(
      `DELETE FROM circles WHERE id = $1 RETURNING id`,
      [circleId]
    );

    return result.rows[0];
  }
}

module.exports = Circle;
