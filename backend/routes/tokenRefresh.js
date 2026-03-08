"use strict";
/** Routes for token refresh. */
const express = require("express");
const router = new express.Router();
const https = require("https");
const { createAccessToken, verifyRefreshToken } = require("../helpers/token");
const { UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { encrypt } = require("../helpers/cryptoHelper");

/** POST /auth/refresh - { refreshToken } => { accessToken }
 *
 * Verifies the refresh token and issues a new access token.
 */
router.post("/refresh", async function (req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.id);

    const accessToken = createAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    return next(new UnauthorizedError("Invalid or expired refresh token"));
  }
});

/** Helper: POST to Google's token endpoint to refresh access token. */
function googleRefreshToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            reject(new Error(parsed.error_description || "Failed to refresh Google token"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/** POST /auth/refresh-google - Refreshes Google OAuth access token
 *
 * Uses stored refresh_token to get a new Google access_token.
 * Requires valid JWT (authenticateJWT must have run).
 */
router.post("/refresh-google", async function (req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();

    const userData = await User.findById(user.id);
    if (!userData.refresh_token) {
      return res.status(400).json({
        error: { message: "No Google refresh token stored. Please re-authenticate with Google." },
      });
    }

    const newAccessToken = await googleRefreshToken(userData.refresh_token);

    // Store encrypted new access token in DB
    const encryptedToken = encrypt(newAccessToken);
    await User.update(user.id, { access_token: encryptedToken });

    return res.json({ access_token: newAccessToken });
  } catch (err) {
    console.error("Google token refresh error:", err.message);
    return next(err);
  }
});

module.exports = router;
