"use strict";

/**Routes for Users */
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { ensureLoggedIn } = require("../middleware/auth");

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
