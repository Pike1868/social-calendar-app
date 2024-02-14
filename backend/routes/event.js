const express = require("express");
const router = express.Router();
const jsonschema = require("jsonschema");
const Event = require("../models/event");
const { ensureLoggedIn } = require("../middleware/auth");
const newEventSchema = require("../schemas/newEvents.json");
const { BadRequestError } = require("../expressError");

router.post("/create", ensureLoggedIn, async (req, res, next) => {
  console.log("=====Route Create Event====");
  try {
    const validator = jsonschema.validate(req.body, newEventSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    console.log("Passed validator????");
    const event = await Event.create(req.body);
    return res.status(201).json({ event });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
