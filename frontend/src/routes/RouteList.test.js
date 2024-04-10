import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../redux/userSlice";
import eventReducer from "../redux/eventSlice";
import googleEventReducer from "../redux/googleEventSlice";
import RouteList from "./RouteList";

//Test for unauthenticated user

test("renders SignIn and SignUp for unauthenticated user", () => {
  //Mock Redux stor with unauthenticated user state
  const store = configureStore({
    reducer: {
      user: () => ({ user: null }),
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/signup"]}>
        <RouteList />
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByText("Sign up")).toBeInTheDocument();
});

//Test for authenticated user
test("renders HomePage for authenticated user", () => {
  //Mock redux store with authenticated user state
  const store = configureStore({
    reducer: {
      user: userReducer,
      events: eventReducer,
      googleEvent: googleEventReducer,
    },
    preloadedState: {
      user: {
        user: { id: "user-id" },
      },
      events: {
        eventList: [],
        showLocalEvents: true,
      },
      googleEvent: {
        events: [],
        showGoogleEvents: true,
      },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/signup"]}>
        <RouteList />
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByText(/profile/i)).toBeInTheDocument();
});
