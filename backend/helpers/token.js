const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

/** Return signed JWT access token from user data. Short-lived. */
function createAccessToken(user) {
  const payload = { id: user.id, type: "access" };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/** Return signed JWT refresh token from user data. Long-lived. */
function createRefreshToken(user) {
  const payload = { id: user.id, type: "refresh" };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/** Return both access and refresh tokens. */
function createTokenPair(user) {
  return {
    accessToken: createAccessToken(user),
    refreshToken: createRefreshToken(user),
  };
}

/** Verify a refresh token and return its payload. Throws on invalid/expired. */
function verifyRefreshToken(token) {
  const payload = jwt.verify(token, SECRET_KEY);
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}

// Keep backward compat alias
const createToken = createAccessToken;

module.exports = {
  createToken,
  createAccessToken,
  createRefreshToken,
  createTokenPair,
  verifyRefreshToken,
};
