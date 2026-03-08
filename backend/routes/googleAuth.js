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
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "select_account",
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  function (req, res) {
    // Generate JWT token pair
    const { accessToken, refreshToken } = createTokenPair(req.user);

    // Send response back to signup page with both tokens
    res.redirect(
      `${process.env.REACT_APP_BASE_URL}/signup?token=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);

module.exports = router;
