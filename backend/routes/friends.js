"use strict";
/** Routes for friends */
const express = require("express");
const router = express.Router();
const jsonschema = require("jsonschema");
const Friendship = require("../models/friendship");
const { ensureLoggedIn } = require("../middleware/auth");
const friendRequestSchema = require("../schemas/friendRequest.json");
const { BadRequestError } = require("../expressError");

/** POST /friends/request
 * Send a friend request by email.
 * Body: { email }
 * Returns { friendship }
 */
router.post("/request", ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, friendRequestSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const friendship = await Friendship.sendRequest(
      res.locals.user.id,
      req.body.email
    );
    return res.status(201).json({ friendship });
  } catch (err) {
    return next(err);
  }
});

/** POST /friends/invite-batch
 * Send friend requests to multiple emails (onboarding).
 * Body: { emails: [string] }
 * Returns { results: [{ email, status, friendship? }] }
 */
router.post("/invite-batch", ensureLoggedIn, async (req, res, next) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new BadRequestError("emails must be a non-empty array");
    }
    if (emails.length > 10) {
      throw new BadRequestError("Maximum 10 invites at once");
    }

    const results = [];
    for (const email of emails) {
      try {
        const friendship = await Friendship.sendRequest(
          res.locals.user.id,
          email
        );
        results.push({ email, status: "sent", friendship });
      } catch (err) {
        results.push({ email, status: "failed", error: err.message });
      }
    }
    return res.status(201).json({ results });
  } catch (err) {
    return next(err);
  }
});

/** GET /friends
 * List all accepted friends.
 * Returns { friends: [...] }
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const friends = await Friendship.listFriends(res.locals.user.id);
    return res.json({ friends });
  } catch (err) {
    return next(err);
  }
});

/** GET /friends/requests
 * List pending incoming friend requests.
 * Returns { requests: [...] }
 */
router.get("/requests", ensureLoggedIn, async (req, res, next) => {
  try {
    const requests = await Friendship.listPendingRequests(res.locals.user.id);
    return res.json({ requests });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /friends/:id/accept
 * Accept a pending friend request.
 * Returns { friendship }
 */
router.patch("/:id/accept", ensureLoggedIn, async (req, res, next) => {
  try {
    const friendship = await Friendship.accept(
      parseInt(req.params.id),
      res.locals.user.id
    );
    return res.json({ friendship });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /friends/:id/decline
 * Decline a pending friend request.
 * Returns { message: "Friend request declined" }
 */
router.patch("/:id/decline", ensureLoggedIn, async (req, res, next) => {
  try {
    await Friendship.decline(parseInt(req.params.id), res.locals.user.id);
    return res.json({ message: "Friend request declined" });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /friends/:id
 * Remove a friendship.
 * Returns { message: "Friend removed" }
 */
router.delete("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    await Friendship.remove(parseInt(req.params.id), res.locals.user.id);
    return res.json({ message: "Friend removed" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
