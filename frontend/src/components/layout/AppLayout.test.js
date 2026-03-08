import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../redux/userSlice";
import eventReducer from "../../redux/eventSlice";
import googleEventReducer from "../../redux/googleEventSlice";
import AppLayout from "./AppLayout";
import { ThemeProvider } from "../../ThemeContext";

// Mock matchMedia for responsive tests
function createMatchMedia(width) {
  return (query) => {
    const matches = (() => {
      // Parse min-width and max-width from query
      const minMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      const maxMatch = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/);
      if (minMatch && maxMatch) {
        return width >= Number(minMatch[1]) && width <= Number(maxMatch[1]);
      }
      if (minMatch) return width >= Number(minMatch[1]);
      if (maxMatch) return width <= Number(maxMatch[1]);
      return false;
    })();
    return {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };
}

const defaultState = {
  user: {
    user: { id: 1 },
    userDetails: null,
    userCalendar: null,
    loading: false,
    error: null,
  },
  events: {
    eventList: [],
    currentEvent: null,
    showLocalEvents: true,
    loading: false,
    error: null,
  },
  googleEvent: {
    events: [],
    currentGoogleEvent: null,
    showGoogleEvents: false,
    loading: false,
    error: null,
  },
};

const renderWithProviders = (
  { route = "/home", width = 1200 } = {}
) => {
  window.matchMedia = createMatchMedia(width);

  const store = configureStore({
    reducer: {
      user: userReducer,
      events: eventReducer,
      googleEvent: googleEventReducer,
    },
    preloadedState: defaultState,
  });

  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/home" element={<div data-testid="home-page">Home</div>} />
                <Route path="/profile" element={<div data-testid="profile-page">Profile</div>} />
                <Route path="/friends" element={<div data-testid="friends-page">Friends</div>} />
                <Route path="/suggestions" element={<div data-testid="suggestions-page">Suggestions</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    ),
    store,
  };
};

describe("AppLayout", () => {
  describe("renders correctly", () => {
    it("renders the top app bar with Circl branding", () => {
      renderWithProviders();
      expect(screen.getByText("Circl")).toBeInTheDocument();
    });

    it("renders page content via Outlet", () => {
      renderWithProviders({ route: "/home" });
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  describe("Desktop layout (>= 900px)", () => {
    it("shows sidebar with navigation links", () => {
      renderWithProviders({ width: 1200 });
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("Friends")).toBeInTheDocument();
      expect(screen.getByText("Suggestions")).toBeInTheDocument();
      // "Profile" appears in both sidebar and top bar
      expect(screen.getAllByText("Profile").length).toBeGreaterThanOrEqual(1);
    });

    it("shows search bar on desktop", () => {
      renderWithProviders({ width: 1200 });
      expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
    });

    it("shows notification bell", () => {
      renderWithProviders({ width: 1200 });
      expect(screen.getByLabelText("notifications")).toBeInTheDocument();
    });

    it("shows sidebar toggle button", () => {
      renderWithProviders({ width: 1200 });
      expect(screen.getByLabelText("toggle sidebar")).toBeInTheDocument();
    });

    it("shows calendar filter section when sidebar is open", () => {
      renderWithProviders({ width: 1200 });
      expect(screen.getByText("Calendars")).toBeInTheDocument();
      expect(screen.getByText("Local Calendar")).toBeInTheDocument();
    });

    it("does NOT show bottom navigation on desktop", () => {
      renderWithProviders({ width: 1200 });
      // Bottom nav shouldn't be visible at desktop widths
      const bottomNav = document.querySelector(".MuiBottomNavigation-root");
      expect(bottomNav).not.toBeInTheDocument();
    });

    it("toggles sidebar collapse on menu button click", () => {
      renderWithProviders({ width: 1200 });
      const menuBtn = screen.getByLabelText("toggle sidebar");
      // Initially open — "Calendars" section should be visible
      expect(screen.getByText("Calendars")).toBeInTheDocument();
      // Click to collapse
      fireEvent.click(menuBtn);
      // Calendar filter text should disappear when collapsed
      expect(screen.queryByText("Calendars")).not.toBeInTheDocument();
    });

    it("shows Log Out button on desktop", () => {
      renderWithProviders({ width: 1200 });
      expect(screen.getByText("Log Out")).toBeInTheDocument();
    });
  });

  describe("Mobile layout (< 900px)", () => {
    it("shows bottom tab navigation with 4 tabs", () => {
      renderWithProviders({ width: 600 });
      const bottomNav = document.querySelector(".MuiBottomNavigation-root");
      expect(bottomNav).toBeInTheDocument();
    });

    it("shows notification bell on mobile", () => {
      renderWithProviders({ width: 600 });
      expect(screen.getByLabelText("notifications")).toBeInTheDocument();
    });

    it("shows hamburger menu for secondary actions", () => {
      renderWithProviders({ width: 600 });
      expect(screen.getByLabelText("more options")).toBeInTheDocument();
    });

    it("does NOT show desktop sidebar on mobile", () => {
      renderWithProviders({ width: 600 });
      // On mobile, the permanent drawer shouldn't render
      expect(screen.queryByLabelText("toggle sidebar")).not.toBeInTheDocument();
    });

    it("does NOT show desktop search bar on mobile", () => {
      renderWithProviders({ width: 600 });
      expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
    });

    it("opens mobile menu with profile, theme toggle, and logout", () => {
      renderWithProviders({ width: 600 });
      const menuBtn = screen.getByLabelText("more options");
      fireEvent.click(menuBtn);
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Log Out")).toBeInTheDocument();
    });
  });

  describe("Breakpoint rendering", () => {
    const breakpoints = [
      { name: "320px (small mobile)", width: 320 },
      { name: "600px (tablet)", width: 600 },
      { name: "900px (desktop)", width: 900 },
      { name: "1200px (large desktop)", width: 1200 },
      { name: "1536px (xl desktop)", width: 1536 },
    ];

    breakpoints.forEach(({ name, width }) => {
      it(`renders without errors at ${name}`, () => {
        expect(() => renderWithProviders({ width })).not.toThrow();
      });
    });

    it("shows bottom nav at 320px", () => {
      renderWithProviders({ width: 320 });
      const bottomNav = document.querySelector(".MuiBottomNavigation-root");
      expect(bottomNav).toBeInTheDocument();
    });

    it("shows sidebar at 900px", () => {
      renderWithProviders({ width: 900 });
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByLabelText("toggle sidebar")).toBeInTheDocument();
    });
  });
});
