"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlPartialUpdate");

/** Related functions for Calendars. */
class Calendar {
  /** Create a calendar (from data), update db, return new calendar data.
   *
   * data should include { id, user_id, title, location, time_zone }
   *
   * Returns { id, user_id, title, location, time_zone, created_at, updated_at, google_id }
   */
  static async create({ id, user_id, title, location, time_zone, google_id }) {
    const result = await db.query(
      `INSERT INTO calendars (
          id,
          user_id,
          title,
          location,
          time_zone,
          google_id
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, location, time_zone, created_at, updated_at`,
      [id, user_id, title, location, time_zone, google_id]
    );
    return result.rows[0];
  }

  /** Find all calendars for a user.
   *
   * Returns [{ id, user_id, title, location, time_zone, created_at, updated_at, google_id }, ...]
   */
  static async findAll(user_id) {
    const result = await db.query(
      `SELECT 
            id, 
            user_id, 
            title, 
            location, 
            time_zone, 
            created_at, 
            updated_at, 
            google_id
       FROM calendars
       WHERE user_id = $1`,
      [user_id]
    );
    
    if (result.rows.length === 0)
      throw new NotFoundError(`No user: ${user_id}`);
    return result.rows;
  }

  /** Given a calendar id, return data about calendar
   *
   * Returns {calendar}
   */
  static async getCalendar(id) {
    const result = await db.query(
      `SELECT 
          id, 
          user_id, 
          title, 
          location, 
          time_zone, 
          created_at, 
          updated_at, 
          google_id
       FROM calendars
       WHERE id = $1`,
      [id]
    );
    const calendar = result.rows[0];

    if (!calendar) throw new NotFoundError(`No calendar found with ID: ${id}`);
    return calendar;
  }

  /** Update calendar data with id and `data` object.
   *
   * This is a "partial update" --- only changes provided fields.
   *
   * Params:
   * Must pass in calendar id,
   * Data object can include: { title, location, time_zone,created_at, updated_at}
   *
   * Returns { id, user_id, title, location, description, start_time, end_time,   status, color_id }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE calendars 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING 
                      id, 
                      user_id, 
                      title, 
                      location, 
                      time_zone, 
                      created_at, 
                      updated_at`;
    const result = await db.query(querySql, [...values, id]);
    const calendar = result.rows[0];

    if (!calendar) throw new NotFoundError(`No calendar found with ID: ${id}`);

    return calendar;
  }

  /** Delete given calendar from database; returns undefined.
   *
   * Throws NotFoundError if calendar not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM calendars
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const calendar = result.rows[0];

    if (!calendar) throw new NotFoundError(`No calendar found with ID: ${id}`);
    return calendar.id;
  }
}

module.exports = Calendar;
