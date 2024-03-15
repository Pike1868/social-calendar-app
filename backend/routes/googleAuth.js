"use strict";
/** Routes for google authentication. */
const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { createToken } = require("../helpers/token");
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
      let encryptedAccessToken = String(accessToken);
      let encryptedRefreshToken = String(refreshToken);
      try {
        let existingUser = await User.get(profile._json.email);

        console.log(accessToken, typeof accessToken);
        console.log(refreshToken, typeof refreshToken);
        // Encrypt tokens before saving them
        encryptedAccessToken = encrypt(accessToken);
        encryptedRefreshToken = encrypt(refreshToken);

        if (existingUser.id) {
          // Update existing user's access and refresh tokens
          User.update(existingUser.id, {
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
          });
          done(null, existingUser);
        }
      } catch (err) {
        if (err instanceof NotFoundError) {
          // Create a new user if existing user is not found

          const newUserId = uuidv4();

          // Encrypt tokens before saving them
          encryptedAccessToken = encrypt(accessToken);
          encryptedRefreshToken = encrypt(refreshToken);

          const newUser = await User.create({
            id: newUserId,
            email: profile._json.email,
            first_name: profile._json.given_name,
            last_name: profile._json.family_name,
            googleId: profile.id,
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
          });

          if (newUser.id) {
            await createDefaultCalendarForUser(newUserId, newUser.firstName);
            done(null, newUser);
          }
        } else {
          done(err);
        }
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
    // If authentication was successful, generate a JWT token
    const token = createToken(req.user);

    // Send response back to signup page with token
    res.redirect(`${process.env.REACT_APP_BASE_URL}/signup?token=${token}`);
  }
);

module.exports = router;
