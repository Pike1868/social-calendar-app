"use strict";
/**Routes for Users */
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Calendar = require("../models/calendar");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

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
      console.log("Route '/user/:id/calendars':", req.params.id);
      const calendars = await Calendar.findAll(req.params.id);
      res.status(200).json({ calendars });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
