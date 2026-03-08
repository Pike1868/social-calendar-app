"use strict";
/** Routes for circles */
const express = require("express");
const router = express.Router();
const jsonschema = require("jsonschema");
const Circle = require("../models/circle");
const { ensureLoggedIn } = require("../middleware/auth");
const circleCreateSchema = require("../schemas/circleCreate.json");
const circleMemberSchema = require("../schemas/circleMember.json");
const { BadRequestError } = require("../expressError");

/** POST /circles
 * Create a named circle.
 * Body: { name }
 * Returns { circle }
 */
router.post("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, circleCreateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const circle = await Circle.create(res.locals.user.id, req.body.name);
    return res.status(201).json({ circle });
  } catch (err) {
    return next(err);
  }
});

/** GET /circles
 * List user's circles with members.
 * Returns { circles: [...] }
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const circles = await Circle.listByUser(res.locals.user.id);
    return res.json({ circles });
  } catch (err) {
    return next(err);
  }
});

/** POST /circles/:id/members
 * Add a friend to a circle.
 * Body: { user_id }
 * Returns { member }
 */
router.post("/:id/members", ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, circleMemberSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const member = await Circle.addMember(
      parseInt(req.params.id),
      req.body.user_id,
      res.locals.user.id
    );
    return res.status(201).json({ member });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /circles/:id/members/:userId
 * Remove a member from a circle.
 * Returns { message: "Member removed from circle" }
 */
router.delete("/:id/members/:userId", ensureLoggedIn, async (req, res, next) => {
  try {
    await Circle.removeMember(
      parseInt(req.params.id),
      req.params.userId,
      res.locals.user.id
    );
    return res.json({ message: "Member removed from circle" });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /circles/:id
 * Delete a circle.
 * Returns { message: "Circle deleted" }
 */
router.delete("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    await Circle.remove(parseInt(req.params.id), res.locals.user.id);
    return res.json({ message: "Circle deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
