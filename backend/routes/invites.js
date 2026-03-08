"use strict";
/** Routes for invite codes */
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../db");
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Generate a random 8-char alphanumeric code */
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/** POST /invites/generate
 * Generate a unique invite code and return the full link.
 * Returns { link, code }
 */
router.post("/generate", ensureLoggedIn, async (req, res, next) => {
  try {
    const inviterId = res.locals.user.id;

    // Generate a unique code (retry on collision)
    let code;
    let attempts = 0;
    while (attempts < 5) {
      code = generateCode();
      const existing = await db.query(
        "SELECT id FROM invite_codes WHERE code = $1",
        [code]
      );
      if (existing.rows.length === 0) break;
      attempts++;
    }

    await db.query(
      `INSERT INTO invite_codes (code, inviter_id)
       VALUES ($1, $2)`,
      [code, inviterId]
    );

    const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:3000";
    const link = `${baseUrl}/signup?invite=${code}`;

    return res.status(201).json({ link, code });
  } catch (err) {
    return next(err);
  }
});

/** GET /invites/my-links
 * List the current user's generated invite links with status.
 * Returns { invites: [...] }
 */
router.get("/my-links", ensureLoggedIn, async (req, res, next) => {
  try {
    const inviterId = res.locals.user.id;

    const result = await db.query(
      `SELECT ic.id, ic.code, ic.created_at, ic.expires_at, ic.used_by,
              u.display_name AS used_by_name
       FROM invite_codes ic
       LEFT JOIN users u ON ic.used_by = u.id
       WHERE ic.inviter_id = $1
       ORDER BY ic.created_at DESC`,
      [inviterId]
    );

    const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:3000";

    const invites = result.rows.map((row) => {
      let status;
      if (row.used_by) {
        status = "used";
      } else if (new Date(row.expires_at) < new Date()) {
        status = "expired";
      } else {
        status = "pending";
      }
      return {
        id: row.id,
        code: row.code,
        link: `${baseUrl}/signup?invite=${row.code}`,
        status,
        used_by_name: row.used_by_name || null,
        created_at: row.created_at,
        expires_at: row.expires_at,
      };
    });

    return res.json({ invites });
  } catch (err) {
    return next(err);
  }
});

/** GET /invites/validate/:code
 * Public route — validate an invite code.
 * Returns { valid, inviter_name }
 */
router.get("/validate/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `SELECT ic.id, ic.used_by, ic.expires_at,
              u.display_name, u.first_name
       FROM invite_codes ic
       JOIN users u ON ic.inviter_id = u.id
       WHERE ic.code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, reason: "Invalid invite code" });
    }

    const invite = result.rows[0];

    if (invite.used_by) {
      return res.json({ valid: false, reason: "Invite code already used" });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.json({ valid: false, reason: "Invite code has expired" });
    }

    const inviterName = invite.display_name || invite.first_name || "A friend";

    return res.json({ valid: true, inviter_name: inviterName });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
