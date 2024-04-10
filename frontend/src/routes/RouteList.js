import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import HomePage from "../pages/HomePage";
import { useSelector } from "react-redux";
import UserProfile from "../pages/UserProfile";

/**
 * RouteList Component:
 *
 * Defines all routes for app
 *  ---Available when logged in:
 * "/home": Displays basic homepage for now
 * "/profile": Displays user information on a profile page
 *
 * "/signin": Displays form for existing users to sign in
 * "/signup": Displays form for new users to sign up
 * - "/*": A catch-all route that redirects any paths with no matches
 *
 */

// RouteList Component
const RouteList = () => {
  const userState = useSelector((state) => state.user);
  const user = userState.user;
  return (
    <Routes>
      {user && user.id ? (
        <>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<UserProfile />} />
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
