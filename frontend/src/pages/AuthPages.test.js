import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../redux/userSlice";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import AuthLayout from "../components/AuthLayout";

// Helper to render with providers
const renderWithProviders = (ui, { preloadedState = {}, route = "/" } = {}) => {
  const store = configureStore({
    reducer: { user: userReducer },
    preloadedState,
  });
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe("AuthLayout", () => {
  it("renders branding text", () => {
    renderWithProviders(
      <AuthLayout>
        <div>child content</div>
      </AuthLayout>
    );
    expect(screen.getByText("Circl")).toBeInTheDocument();
    expect(
      screen.getByText("Stay close to the people who matter")
    ).toBeInTheDocument();
  });

  it("renders privacy trust message", () => {
    renderWithProviders(
      <AuthLayout>
        <div>child</div>
      </AuthLayout>
    );
    expect(
      screen.getByText(
        "We only see when you're free — never your event details"
      )
    ).toBeInTheDocument();
  });

  it("renders children inside the layout", () => {
    renderWithProviders(
      <AuthLayout>
        <div data-testid="test-child">Hello</div>
      </AuthLayout>
    );
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });
});

describe("SignIn Page", () => {
  it("renders without crashing", () => {
    renderWithProviders(<SignIn />);
  });

  it("displays welcome heading", () => {
    renderWithProviders(<SignIn />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("displays Continue with Google as primary CTA", () => {
    renderWithProviders(<SignIn />);
    const googleBtn = screen.getByRole("link", {
      name: /continue with google/i,
    });
    expect(googleBtn).toBeInTheDocument();
  });

  it("Google button links to server OAuth endpoint", () => {
    renderWithProviders(<SignIn />);
    const googleBtn = screen.getByRole("link", {
      name: /continue with google/i,
    });
    expect(googleBtn.getAttribute("href")).toContain("/auth/google");
  });

  it("displays email and password fields", () => {
    renderWithProviders(<SignIn />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("displays email sign-in button as secondary (outlined)", () => {
    renderWithProviders(<SignIn />);
    const signInBtn = screen.getByRole("button", { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
  });

  it("has link to sign up page", () => {
    renderWithProviders(<SignIn />);
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("shows divider with 'or sign in with email'", () => {
    renderWithProviders(<SignIn />);
    expect(screen.getByText("or sign in with email")).toBeInTheDocument();
  });

  it("displays error from redux state", () => {
    renderWithProviders(<SignIn />, {
      preloadedState: {
        user: {
          user: null,
          userDetails: null,
          userCalendar: null,
          loading: false,
          error: "Invalid credentials",
        },
      },
    });
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("error alert has close button", () => {
    renderWithProviders(<SignIn />, {
      preloadedState: {
        user: {
          user: null,
          userDetails: null,
          userCalendar: null,
          loading: false,
          error: "Test error",
        },
      },
    });
    const closeBtn = screen.getByRole("button", { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it("renders privacy trust line via AuthLayout", () => {
    renderWithProviders(<SignIn />);
    expect(
      screen.getByText(
        "We only see when you're free — never your event details"
      )
    ).toBeInTheDocument();
  });
});

describe("SignUp Page", () => {
  it("renders without crashing", () => {
    renderWithProviders(<SignUp />);
  });

  it("displays create account heading", () => {
    renderWithProviders(<SignUp />);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("displays Continue with Google as primary CTA", () => {
    renderWithProviders(<SignUp />);
    const googleBtn = screen.getByRole("link", {
      name: /continue with google/i,
    });
    expect(googleBtn).toBeInTheDocument();
  });

  it("Google button links to server OAuth endpoint", () => {
    renderWithProviders(<SignUp />);
    const googleBtn = screen.getByRole("link", {
      name: /continue with google/i,
    });
    expect(googleBtn.getAttribute("href")).toContain("/auth/google");
  });

  it("displays all registration fields", () => {
    renderWithProviders(<SignUp />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("displays Create Account button as secondary", () => {
    renderWithProviders(<SignUp />);
    const createBtn = screen.getByRole("button", {
      name: /create account/i,
    });
    expect(createBtn).toBeInTheDocument();
  });

  it("has link to sign in page", () => {
    renderWithProviders(<SignUp />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows divider with 'or sign up with email'", () => {
    renderWithProviders(<SignUp />);
    expect(screen.getByText("or sign up with email")).toBeInTheDocument();
  });

  it("displays error from redux state", () => {
    renderWithProviders(<SignUp />, {
      preloadedState: {
        user: {
          user: null,
          userDetails: null,
          userCalendar: null,
          loading: false,
          error: "Email already exists",
        },
      },
    });
    expect(screen.getByText("Email already exists")).toBeInTheDocument();
  });

  it("validates empty fields on submit", () => {
    const { store } = renderWithProviders(<SignUp />);
    const createBtn = screen.getByRole("button", {
      name: /create account/i,
    });
    fireEvent.click(createBtn);
    // After submitting empty form, error should appear in store
    const state = store.getState();
    expect(state.user.error).toBeTruthy();
  });

  it("validates email format", () => {
    const { store } = renderWithProviders(<SignUp />);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    const createBtn = screen.getByRole("button", {
      name: /create account/i,
    });
    fireEvent.click(createBtn);

    const state = store.getState();
    expect(state.user.error).toBe("Please enter a valid email address.");
  });

  it("validates password length", () => {
    const { store } = renderWithProviders(<SignUp />);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "ab" },
    });

    const createBtn = screen.getByRole("button", {
      name: /create account/i,
    });
    fireEvent.click(createBtn);

    const state = store.getState();
    expect(state.user.error).toBe(
      "Password must be at least 5 characters long."
    );
  });

  it("renders privacy trust line via AuthLayout", () => {
    renderWithProviders(<SignUp />);
    expect(
      screen.getByText(
        "We only see when you're free — never your event details"
      )
    ).toBeInTheDocument();
  });
});
