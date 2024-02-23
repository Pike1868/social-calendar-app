import React, { useEffect } from "react";
import "./assets/App.css";
import RouteList from "./routes/RouteList";
import { useDispatch } from "react-redux";
import { setUser } from "./redux/userSlice"; // Import the setUser action
import { decodeToken } from "./redux/helpers/decodeTokenHelper";
import { useNavigate } from "react-router-dom";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Grab token from google auth redirection
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get("token");
    if (authToken) {
      // Store token and update the application state
      localStorage.setItem("socialCalToken", authToken);
      const decoded = decodeToken(authToken);
      if (!decoded.isTokenExpired) {
        dispatch(setUser({ id: decoded.id }));
      } else {
        console.error("Token is invalid or expired.");
        localStorage.removeItem("socialCalToken");
      }
      // Clean up the URL
      window.history.replaceState(null, "", window.location.pathname);

      //Redirect to homepage
      navigate("/");
    }
  }, [dispatch, navigate]);

  return (
    <main className="App">
      <RouteList />
    </main>
  );
}

export default App;
