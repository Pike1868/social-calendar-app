"use strict";

const https = require("https");
const { encrypt } = require("../helpers/cryptoHelper");
const User = require("../models/user");

/**
 * Refresh a Google access token using the refresh token.
 * Returns the new access token string.
 */
function refreshGoogleToken(refreshToken) {
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

/**
 * Query Google Calendar FreeBusy API for a single user's availability.
 *
 * @param {string} accessToken - Decrypted Google access token
 * @param {string} timeMin - ISO 8601 start time
 * @param {string} timeMax - ISO 8601 end time
 * @param {string} timeZone - IANA timezone string (optional)
 * @returns {Promise<Array<{start: string, end: string}>>} - busy blocks
 */
function queryFreeBusy(accessToken, timeMin, timeMax, timeZone) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      timeMin,
      timeMax,
      timeZone: timeZone || "UTC",
      items: [{ id: "primary" }],
    });

    const options = {
      hostname: "www.googleapis.com",
      path: "/calendar/v3/freeBusy",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode === 401) {
            const err = new Error("Token expired");
            err.code = "TOKEN_EXPIRED";
            return reject(err);
          }

          if (res.statusCode !== 200) {
            return reject(new Error(
              parsed.error?.message || `Google API error (${res.statusCode})`
            ));
          }

          // Extract only busy blocks from primary calendar — never event details
          const calendars = parsed.calendars || {};
          const primary = calendars["primary"] || {};
          const busy = (primary.busy || []).map(block => ({
            start: block.start,
            end: block.end,
          }));

          resolve(busy);
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

/**
 * Fetch FreeBusy data for a single user, handling token refresh if needed.
 *
 * @param {object} userData - User record with decrypted access_token and refresh_token
 * @param {string} timeMin - ISO 8601 start
 * @param {string} timeMax - ISO 8601 end
 * @param {string} timeZone - IANA timezone
 * @returns {Promise<Array<{start: string, end: string}>>}
 */
async function fetchFreeBusyForUser(userData, timeMin, timeMax, timeZone) {
  try {
    return await queryFreeBusy(userData.access_token, timeMin, timeMax, timeZone);
  } catch (err) {
    if (err.code === "TOKEN_EXPIRED" && userData.refresh_token) {
      // Refresh the token and retry
      const newAccessToken = await refreshGoogleToken(userData.refresh_token);

      // Store the refreshed token (encrypted) in DB
      const encryptedToken = encrypt(newAccessToken);
      await User.update(userData.id, { access_token: encryptedToken });

      return await queryFreeBusy(newAccessToken, timeMin, timeMax, timeZone);
    }
    throw err;
  }
}

module.exports = {
  refreshGoogleToken,
  queryFreeBusy,
  fetchFreeBusyForUser,
};
