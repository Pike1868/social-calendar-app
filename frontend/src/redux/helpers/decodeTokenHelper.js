import { jwtDecode } from "jwt-decode";

/** Decode a JWT and return its payload with expiry info.
 *  Returns { id, exp } or undefined on error.
 */
export const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    const isExpired = Date.now() >= decoded.exp * 1000;

    if (!isExpired) {
      return { id: decoded.id, exp: decoded.exp };
    } else {
      throw new Error("Invalid or expired token.");
    }
  } catch (err) {
    console.error("Error decoding token:", err);
  }
};

/** Returns milliseconds until the token expires. Negative if already expired. */
export const getTokenTimeRemaining = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 - Date.now();
  } catch {
    return -1;
  }
};
