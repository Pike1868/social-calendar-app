"use strict";
/** Routes for calendar */
const express = require("express");
const router = express.Router();
const Calendar = require("../models/calendar");

// Fetch a specific calendar by its ID
router.get("/:calendar_id", async (req, res, next) => {
  console.log("Route Get Calendar");
  try {
    const calendar = await Calendar.getCalendar(req.params.calendar_id);
    return res.status(200).json({ calendar });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
