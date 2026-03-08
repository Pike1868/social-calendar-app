import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import HomePage from "../pages/HomePage";
import UserProfile from "../pages/UserProfile";
import FriendsPage from "../pages/FriendsPage";
import AppLayout from "../components/layout/AppLayout";
import { useSelector } from "react-redux";

const RouteList = () => {
  const userState = useSelector((state) => state.user);
  const user = userState.user;
  return (
    <Routes>
      {user && user.id ? (
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/suggestions" element={<PlaceholderPage title="Suggestions" />} />
          <Route path="/*" element={<Navigate to="/home" />} />
        </Route>
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

// Placeholder for pages not yet built
function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: "24px" }}>
      <h2>{title}</h2>
      <p>Coming soon.</p>
    </div>
  );
}

export default RouteList;
