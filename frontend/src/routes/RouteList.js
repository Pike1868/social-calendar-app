import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import { useUserContext } from "../context/UserContext";
import HomePage from "../pages/HomePage";

/**
 * RouteList Component:
 *
 * Defines all routes for app
 *  ---Available when logged in:
 * "/": Displays basic homepage for now
 *
 * "/signin": Displays form for existing users to sign in
 * "/signup": Displays form for new users to sign up
 * - "/*": A catch-all route that redirects any paths with no matches
 *
 */

// RouteList Component
const RouteList = () => {
  const { user } = useUserContext();
  console.log(user);
  return (
    <Routes>
      {user ? (
        <>
          <Route path="/home" element={<HomePage />} />
          <Route path="/*" element={<Navigate to="/home" />} />
        </>
      ) : (
        <>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/*" element={<Navigate to="/signup" />} />
        </>
      )}
    </Routes>
  );
};

export default RouteList;
