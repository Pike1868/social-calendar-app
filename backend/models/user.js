"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

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
   * Returns {id, email, firstName, LastName}
   *
   * Throws BadRequestError on duplicates.
   *
   */

  static async create({ id, email, firstName, lastName, googleId }) {
    const result = await db.query(
      `INSERT INTO users
          (id, email, first_name, last_name, google_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, first_name AS "firstName", last_name AS "lastName"`,
      [id, email, firstName, lastName, googleId]
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
   * Returns { id, email, first_name, last_name }
   *
   * Throws NotFoundError if user not found.
   **/

  static async findById(id) {
    console.log(id);
    const userRes = await db.query(
      `SELECT id,
              first_name,
              last_name,
              email,
              time_zone
         FROM users
         WHERE id = $1`,
      [id]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user with id: ${id}`);
    return user;
  }
}

module.exports = User;
