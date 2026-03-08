import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import HomePage from "../pages/HomePage";
import UserProfile from "../pages/UserProfile";
import FriendsPage from "../pages/FriendsPage";
import FindATimePage from "../pages/FindATimePage";
import OnboardingPage from "../pages/OnboardingPage";
import AppLayout from "../components/layout/AppLayout";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserDetails, selectUserDetails } from "../redux/userSlice";

/** Wrapper that fetches user details and redirects to onboarding if needed. */
function OnboardingGate({ children }) {
  const userState = useSelector((state) => state.user);
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = userState.user?.id;

  // Fetch details if not loaded
  useEffect(() => {
    if (userId && !userDetails) {
      dispatch(fetchUserDetails(userId));
    }
  }, [userId, userDetails, dispatch]);

  // Redirect to onboarding when details loaded and not complete
  useEffect(() => {
    if (userDetails && userDetails.onboarding_complete === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [userDetails, navigate]);

  // Still loading user details
  if (!userDetails) return null;

  // Show children (app) only if onboarding is complete
  if (userDetails.onboarding_complete === false) return null;

  return children;
}

const RouteList = () => {
  const userState = useSelector((state) => state.user);
  const user = userState.user;
  return (
    <Routes>
      {user && user.id ? (
        <>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            element={
              <OnboardingGate>
                <AppLayout />
              </OnboardingGate>
            }
          >
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/find-a-time" element={<FindATimePage />} />
            <Route path="/suggestions" element={<PlaceholderPage title="Suggestions" />} />
            <Route path="/*" element={<Navigate to="/home" />} />
          </Route>
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
