"use strict";
/** Routes for suggestions */
const express = require("express");
const router = express.Router();
const Suggestion = require("../models/suggestion");
const { ensureLoggedIn } = require("../middleware/auth");
const { generateForUser } = require("../services/suggestionEngine");

/** GET /suggestions
 * List active suggestions for the current user.
 * Returns { suggestions: [...] }
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const suggestions = await Suggestion.listByUser(res.locals.user.id);
    return res.json({ suggestions });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /suggestions/:id/dismiss
 * Dismiss a suggestion.
 * Returns { suggestion: { id, status } }
 */
router.patch("/:id/dismiss", ensureLoggedIn, async (req, res, next) => {
  try {
    const suggestion = await Suggestion.dismiss(
      parseInt(req.params.id),
      res.locals.user.id
    );
    return res.json({ suggestion });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /suggestions/:id/acted
 * Mark a suggestion as acted on.
 * Returns { suggestion: { id, status } }
 */
router.patch("/:id/acted", ensureLoggedIn, async (req, res, next) => {
  try {
    const suggestion = await Suggestion.markActed(
      parseInt(req.params.id),
      res.locals.user.id
    );
    return res.json({ suggestion });
  } catch (err) {
    return next(err);
  }
});

/** POST /suggestions/generate
 * Trigger suggestion generation for the current user.
 * Returns { suggestions: [...] }
 */
router.post("/generate", ensureLoggedIn, async (req, res, next) => {
  try {
    const suggestions = await generateForUser(res.locals.user.id);
    return res.json({ suggestions });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
