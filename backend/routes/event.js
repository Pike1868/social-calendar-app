const express = require("express");
const router = express.Router();
const jsonschema = require("jsonschema");
const Event = require("../models/event");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const newEventSchema = require("../schemas/newEvents.json");
const { BadRequestError } = require("../expressError");

//TODO:**Add test cases this route**

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

/** POST /event/create:
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
      const validator = jsonschema.validate(req.body, newEventSchema);
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

module.exports = router;
