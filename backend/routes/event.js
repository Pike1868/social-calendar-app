"use strict";
/** Routes for event */
const express = require("express");
const router = express.Router();
const jsonschema = require("jsonschema");
const Event = require("../models/event");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const EventSchema = require("../schemas/events.json");
const { BadRequestError } = require("../expressError");

/**TODO - Add test cases for these routes:
 * findAll
 * update
 * delete
 *
 */

/** GET /event/:calendar_id
 * required:{calendar_id}
 * optional:{location, description, status, color_id, time_zone, google_id}
 *
 * Returns event object
 */
router.get(
  "/findAll/:calendar_id",
  ensureLoggedIn,
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      const events = await Event.findAll(req.params.calendar_id);
      return res.status(200).json({ events });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /event/create
 * required:{calendar_id, title,start_time, end_time}
 * optional:{location, description, status, color_id, time_zone, google_id }
 *
 * Returns event object
 */
router.post(
  "/create",
  ensureLoggedIn,
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, EventSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      const event = await Event.create(req.body);
      return res.status(201).json({ event });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /event/update/:id
 * required:{id, calendar_id, title,start_time, end_time}
 * optional:{location, description, status, color_id, time_zone, google_id }
 *
 * Returns event object
 */
router.patch("/update/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, EventSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const event = await Event.update(req.params.id, req.body);
    return res.json({ event });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /event/:id
 * required:{id}
 * Returns json {message: "Event deleted"}
 */
router.delete(
  "/:id",
  ensureLoggedIn,
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      await Event.remove(req.params.id);
      return res.json({ message: "Event deleted" });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
