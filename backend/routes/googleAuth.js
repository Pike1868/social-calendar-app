"use strict";
/** Routes for google authentication. */
const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { createTokenPair } = require("../helpers/token");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError } = require("../expressError");
const {
  createDefaultCalendarForUser,
} = require("../helpers/createDefaultCalendar");
const { encrypt } = require("../helpers/cryptoHelper");
const db = require("../db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_BASE_URL}/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Encrypt tokens before saving
        const encryptedAccessToken = encrypt(accessToken);
        const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

        let existingUser;
        try {
          existingUser = await User.get(profile._json.email);
        } catch (err) {
          if (!(err instanceof NotFoundError)) throw err;
        }

        if (existingUser) {
          // Update existing user's tokens
          const updateData = { access_token: encryptedAccessToken };
          if (encryptedRefreshToken) {
            updateData.refresh_token = encryptedRefreshToken;
          }
          await User.update(existingUser.id, updateData);
          done(null, existingUser);
        } else {
          // Create a new user
          const newUserId = uuidv4();
          const newUser = await User.create({
            id: newUserId,
            email: profile._json.email,
            first_name: profile._json.given_name,
            last_name: profile._json.family_name,
            google_id: profile.id,
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
          });

          if (newUser.id) {
            await createDefaultCalendarForUser(newUserId, newUser.first_name);
            done(null, newUser);
          }
        }
      } catch (err) {
        done(err);
      }
    }
  )
);

// Google authentication route
router.get("/google", (req, res, next) => {
  const options = {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "select_account",
    session: false,
  };
  // Pass invite code through OAuth state parameter
  if (req.query.invite) {
    options.state = req.query.invite;
  }
  passport.authenticate("google", options)(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async function (req, res) {
    // Generate JWT token pair
    const { accessToken, refreshToken } = createTokenPair(req.user);

    // Check for invite code in the state parameter or original query
    const inviteCode = req.query.invite || req.query.state;
    if (inviteCode && req.user) {
      try {
        // Look up the invite code
        const inviteResult = await db.query(
          `SELECT id, inviter_id, used_by FROM invite_codes
           WHERE code = $1 AND used_by IS NULL AND expires_at > NOW()`,
          [inviteCode]
        );

        if (inviteResult.rows.length > 0) {
          const invite = inviteResult.rows[0];
          const inviterId = invite.inviter_id;
          const newUserId = req.user.id;

          // Only create friendship if inviter and new user are different
          if (inviterId !== newUserId) {
            // Check if friendship already exists
            const existingFriendship = await db.query(
              `SELECT id FROM friendships
               WHERE (requester_id = $1 AND addressee_id = $2)
                  OR (requester_id = $2 AND addressee_id = $1)`,
              [inviterId, newUserId]
            );

            if (existingFriendship.rows.length === 0) {
              // Auto-create accepted friendship
              await db.query(
                `INSERT INTO friendships (requester_id, addressee_id, status)
                 VALUES ($1, $2, 'accepted')`,
                [inviterId, newUserId]
              );
            }

            // Mark invite code as used
            await db.query(
              `UPDATE invite_codes SET used_by = $1 WHERE id = $2`,
              [newUserId, invite.id]
            );
          }
        }
      } catch (err) {
        console.error("Error processing invite code during OAuth:", err);
        // Don't block login if invite processing fails
      }
    }

    // Send response back to signup page with both tokens
    res.redirect(
      `${process.env.REACT_APP_BASE_URL}/signup?token=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);

module.exports = router;
