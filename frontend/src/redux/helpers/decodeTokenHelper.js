import { jwtDecode } from "jwt-decode";

export const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    const isTokenExpired = Date.now() >= decoded.exp * 1000;

    if (!isTokenExpired) {
      return { id: decoded.id };
    } else {
      throw new Error("Invalid or expired token.");
    }
  } catch (err) {
    console.error("Error decoding token:", err);
  }
};
