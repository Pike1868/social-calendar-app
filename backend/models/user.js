"use strict";
const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sqlPartialUpdate");
const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { decrypt } = require("../helpers/cryptoHelper.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { id, username, first_name, last_name, email }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(email, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT id,
              email,
              password,
              first_name,
              last_name
           FROM users
           WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid email/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register({
    id,
    password,
    first_name,
    last_name,
    email,
    time_zone,
  }) {
    const duplicateCheck = await db.query(
      `SELECT email
           FROM users
           WHERE email = $1`,
      [email]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate email: ${email}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
           (id, 
            email,
            password,
            first_name,
            last_name, 
            time_zone)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, email, first_name, last_name, time_zone`,
      [id, email, hashedPassword, first_name, last_name, time_zone]
    );

    const user = result.rows[0];

    return user;
  }

  /**Create new user with Google profile data
   *
   * Returns {id, email, first_name ,last_name, refresh_token, access_token}
   *
   * Throws BadRequestError on duplicates.
   *
   */

  static async create({
    id,
    email,
    first_name,
    last_name,
    google_id,
    access_token,
    refresh_token,
  }) {
    const result = await db.query(
      `INSERT INTO users
          (id, email, first_name, last_name, google_id, access_token, refresh_token)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, email, first_name ,last_name, refresh_token, access_token`,
      [id, email, first_name, last_name, google_id, access_token, refresh_token]
    );
    const user = result.rows[0];
    return user;
  }

  /** Given an email, return data about user.
   *
   * Returns { email, first_name, last_name}
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(email) {
    const userRes = await db.query(
      `SELECT id,
              email
           FROM users
           WHERE email = $1`,
      [email]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${email}`);
    return user;
  }

  /** Given a user ID, return data about the user.
   *
   * Returns { id, email, first_name, last_name, google_id, access_token }
   *
   * Throws NotFoundError if user not found.
   **/

  static async findById(id) {
    const userRes = await db.query(
      `SELECT id,
              first_name,
              last_name,
              email,
              time_zone, 
              google_id,
              access_token
         FROM users
         WHERE id = $1`,
      [id]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user with id: ${id}`);

    // Decrypt access_token and refresh_token if they exist
    if (user.access_token) user.access_token = decrypt(user.access_token);
    if (user.refresh_token) user.refresh_token = decrypt(user.refresh_token);
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { first_name, last_name, email,birthday, time_zone, access_token, refresh_token  }
   *
   * Returns {id, first_name, last_name, email,birthday, time_zone, access_token, refresh_token }
   *
   * Throws NotFoundError if not found.
   *
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id,first_name, last_name, email,birthday, time_zone, access_token, refresh_token`;
    const result = await db.query(querySql, [...values, id]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${id}`);
    return user;
  }
}

module.exports = User;
