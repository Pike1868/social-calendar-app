"use strict";

/** Routes for local authentication. */
const jsonschema = require("jsonschema");
const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/token");
const userLocalRegistrationSchema = require("../schemas/userLocalRegistration.json");
const userLocalAuth = require("../schemas/userLocalAuth.json");
const { BadRequestError, NotFoundError } = require("../expressError");
const { v4: uuidv4 } = require("uuid");
const {
  createDefaultCalendarForUser,
} = require("../helpers/createDefaultCalendar");

/** POST /auth/token:  { email, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 */

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userLocalAuth);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const { email, password } = req.body;
    const user = await User.authenticate(email, password);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/** POST /auth/register:   { user } => { token }
 *
 * user must include {  email, password, firstName, lastName }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 */

router.post("/register", async function (req, res, next) {
  try {
    const { email } = req.body;

    // Check for duplicate email
    let userExists;
    try {
      userExists = await User.get(email);
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        return next(err);
      }
      // If NotFoundError, user does not exist, and it's safe to proceed with registration
      userExists = false;
    }

    if (userExists) {
      return res
        .status(400)
        .json({ error: { message: "Please choose another email" } });
    }

    const validator = jsonschema.validate(
      req.body,
      userLocalRegistrationSchema
    );
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    //Generate an id for the new user
    const newUserId = uuidv4();
    const newUser = await User.register({ id: newUserId, ...req.body });

    // Create a default calendar for the new user
    await createDefaultCalendarForUser(newUserId, req.body.firstName);

    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
