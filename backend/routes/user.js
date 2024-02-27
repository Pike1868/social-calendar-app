"use strict";
/**Routes for Users */
const express = require("express");
const router = express.Router();
const jsonschema = require("jsonschema");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const Calendar = require("../models/calendar");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const updateUserSchema = require("../schemas/updateUser.json");

/** GET "/users/:id"
 *
 * Returns { id, email, first_name, last_name, google_id}
 */

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

/** GET "/users/:id/calendars"
 *
 * Returns all calendars for a user
 */

router.get(
  "/:id/calendars",
  ensureLoggedIn,
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      const calendars = await Calendar.findAll(req.params.id);
      res.status(200).json({ calendars });
    } catch (err) {
      next(err);
    }
  }
);

/**PATCH "/users/:id"
 *
 * Returns user object
 */

router.patch(
  "/:id",
  ensureLoggedIn,
  ensureCorrectUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, updateUserSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const { first_name, last_name, birthday, time_zone } = req.body;

      // Ensure only allowed fields are updated
      const updateData = {
        first_name,
        last_name,
        birthday,
        time_zone,
      };
      const user = await User.update(req.params.id, updateData);

      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
