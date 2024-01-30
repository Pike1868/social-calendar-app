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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let existingUser = await User.get(profile._json.email);
        console.log("Existing user, should be returned with id", existingUser);
        //if existing user return
        if (existingUser.id) {
          done(null, existingUser);
        }
      } catch (err) {
        if (err instanceof NotFoundError) {
          // Create a new user if existing user is not found
          const newUserId = uuidv4();
          const newUser = await User.create({
            id: newUserId,
            email: profile._json.email,
            firstName: profile._json.given_name,
            lastName: profile._json.family_name,
            googleId: profile.id,
          });

          if (newUser.id) {
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
    scope: ["profile", "email"],
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
    res.redirect(`http://localhost:3000/signup?token=${token}`);
  }
);

module.exports = router;
