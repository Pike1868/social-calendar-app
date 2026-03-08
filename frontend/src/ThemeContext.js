import React, { createContext, useContext, useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { lightTheme, darkTheme } from "./theme";

const ThemeContext = createContext({
  mode: "light",
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("circlThemeMode");
    return saved === "dark" ? "dark" : "light";
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("circlThemeMode", next);
      return next;
    });
  };

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode]
  );

  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
