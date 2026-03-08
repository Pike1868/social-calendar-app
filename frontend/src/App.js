import React, { useEffect, useCallback } from "react";
import "./assets/App.css";
import RouteList from "./routes/RouteList";
import { useDispatch } from "react-redux";
import { setUser } from "./redux/userSlice";
import { decodeToken, getTokenTimeRemaining } from "./redux/helpers/decodeTokenHelper";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { resetState } from "./redux/helpers/globalActions";

// Refresh access token 2 minutes before it expires
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    dispatch(resetState());
    navigate("/signin");
  }, [dispatch, navigate]);

  useEffect(() => {
    // Grab tokens from google auth redirection
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get("token");
    const refreshToken = urlParams.get("refreshToken");

    if (authToken) {
      // Store tokens
      localStorage.setItem("socialCalToken", authToken);
      if (refreshToken) {
        localStorage.setItem("socialCalRefreshToken", refreshToken);
      }

      const decoded = decodeToken(authToken);
      if (decoded && decoded.id) {
        dispatch(setUser({ id: decoded.id }));
        // Clean up URL and navigate after Redux state is set
        window.history.replaceState(null, "", "/");
      } else {
        console.error("Token is invalid or expired.");
        localStorage.removeItem("socialCalToken");
        localStorage.removeItem("socialCalRefreshToken");
      }
    }
  }, [dispatch]);

  // Listen for forced logout from interceptor (when refresh token expires)
  useEffect(() => {
    const onForcedLogout = () => handleLogout();
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, [handleLogout]);

  // Proactive token refresh timer
  useEffect(() => {
    let timerId;

    const scheduleRefresh = () => {
      const token = localStorage.getItem("socialCalToken");
      if (!token) return;

      const timeRemaining = getTokenTimeRemaining(token);
      if (timeRemaining <= 0) return;

      // Schedule refresh 2 minutes before expiry (or immediately if less than buffer)
      const refreshIn = Math.max(timeRemaining - REFRESH_BUFFER_MS, 0);

      timerId = setTimeout(async () => {
        try {
          const refreshToken = localStorage.getItem("socialCalRefreshToken");
          if (!refreshToken) return;

          const axios = (await import("axios")).default;
          const BASE_URL = process.env.REACT_APP_SERVER_URL;
          const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data;

          localStorage.setItem("socialCalToken", accessToken);
          // Schedule the next refresh
          scheduleRefresh();
        } catch (err) {
          console.error("Proactive token refresh failed:", err);
        }
      }, refreshIn);
    };

    scheduleRefresh();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <main className="App">
      <RouteList />
    </main>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
