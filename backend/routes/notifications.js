"use strict";
/** Routes for notifications */
const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const { ensureLoggedIn } = require("../middleware/auth");

/** GET /notifications
 * List recent notifications for the current user.
 * Returns { notifications: [...] }
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const notifications = await Notification.listByUser(res.locals.user.id);
    return res.json({ notifications });
  } catch (err) {
    return next(err);
  }
});

/** GET /notifications/unread-count
 * Get count of unread notifications for the current user.
 * Returns { count: number }
 */
router.get("/unread-count", ensureLoggedIn, async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(res.locals.user.id);
    return res.json({ count });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /notifications/:id/read
 * Mark a single notification as read.
 * Returns { notification: { id, read } }
 */
router.patch("/:id/read", ensureLoggedIn, async (req, res, next) => {
  try {
    const notification = await Notification.markRead(
      parseInt(req.params.id),
      res.locals.user.id
    );
    return res.json({ notification });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /notifications/read-all
 * Mark all notifications as read for the current user.
 * Returns { updated: number }
 */
router.patch("/read-all", ensureLoggedIn, async (req, res, next) => {
  try {
    const updated = await Notification.markAllRead(res.locals.user.id);
    return res.json({ updated });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
