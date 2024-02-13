"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlPartialUpdate");

/**Related functions for Events */

class Event {
  /** Create an event (from data), update db, return new event data.
   *
   * data should be { calendar_id, title, start_time, end_time } minimum
   *
   * Returns { event object}
   **/

  static async create(data) {
    const result = await db.query(
      `
            INSERT INTO events (
                id,
                calendar_id, 
                title, 
                location,
                description,
                start_time,
                end_time,
                status,
                color_id,
                time_zone,
                google_id)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id,calendar_id, title, location, description, start_time, end_time, status, color_id, time_zone, google_id`,
      [
        data.id,
        data.calendar_id,
        data.title,
        data.location,
        data.description,
        data.start_time,
        data.end_time,
        data.status,
        data.color_id,
        data.time_zone,
        data.google_id,
      ]
    );
    let event = result.rows[0];

    return event;
  }

  /** Find all events on that calendar
   *
   * Returns [{ id,calendar_id, title, location, description, start_time, end_time, status, color_id, time_zone, google_id }, ...]
   **/

  static async findAll(calendar_id) {
    const result = await db.query(
      `
        SELECT 
              id,
              calendar_id,
              owner_id,
              title, 
              location, 
              description, 
              start_time, 
              end_time, 
              status, 
              color_id, 
              time_zone, 
              google_id 
        FROM events
        WHERE calendar_id = $1`,
      [calendar_id]
    );

    let allEvents = result.rows;

    return allEvents;
  }

  /** Given an event id, return data about event
   *
   * Returns {event}
   */
  static async getEvent(id) {
    let result = await db.query(
      `
        SELECT 
              id,
              owner_id,
              calendar_id,
              title,
              location,
              description,
              start_time,
              end_time,
              status,
              created_at,
              updated_at,
              color_id,
              time_zone,
              google_id 
        FROM events
        WHERE id = $1`,
      [id]
    );
    const event = result.rows[0];

    if (!event) {
      throw new NotFoundError(`No event found with ID: ${id}`);
    }

    return event;
  }

  /** Update event data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data must include {id}, can also include: {id, title, location, description, start_time, end_time, status, color_id, }
   *
   * Returns { id, calendar_id, title, location, description, start_time, end_time, status, color_id, }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE events 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING 
                        id,  
                        calendar_id,
                        owner_id, 
                        title, 
                        location, 
                        description, 
                        start_time, 
                        end_time, 
                        status, 
                        color_id, 
                        created_at, 
                        updated_at,
                        time_zone,
                        google_id`;
    const result = await db.query(querySql, [...values, id]);
    const event = result.rows[0];

    if (!event) throw new NotFoundError(`No event found with ID: ${id}`);

    return event;
  }

  /** Delete given event from database; returns undefined.
   *
   * Throws NotFoundError if event not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM events
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const event = result.rows[0];

    if (!event) throw new NotFoundError(`No event found with ID: ${id}`);
  }
}

module.exports = Event;
