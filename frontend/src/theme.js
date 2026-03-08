import { createTheme } from "@mui/material/styles";

// Circl Design Tokens (PRD Section 6.1)
const tokens = {
  colors: {
    primary: "#1B5E20",
    primaryLight: "#2E7D32",
    primaryDark: "#0D3B13",
    accent: "#C6993A",
    accentLight: "#D4AF61",
    accentDark: "#A67C2E",
    success: "#2E7D32",
    error: "#C62828",
    black: "#111111",
    white: "#FFFFFF",
    light: {
      background: "#FAFAFA",
      surface: "#FFFFFF",
      textPrimary: "#111111",
      textSecondary: "#666666",
      border: "#E0E0E0",
    },
    dark: {
      background: "#121212",
      surface: "#1E1E1E",
      textPrimary: "#F5F5F5",
      textSecondary: "#A0A0A0",
      border: "#333333",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "'SF Pro Display'",
      "'SF Pro Text'",
      "'Helvetica Neue'",
      "sans-serif",
    ].join(", "),
    headingWeight: 600,
    bodyWeight: 400,
  },
  spacing: 4, // base unit in px
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
  },
  shadows: {
    subtle: "0 1px 3px rgba(0,0,0,0.06)",
    medium: "0 4px 12px rgba(0,0,0,0.08)",
    elevated: "0 8px 24px rgba(0,0,0,0.10)",
  },
};

// Shared theme options for both light and dark
const getDesignTokens = (mode) => {
  const isDark = mode === "dark";
  const modeColors = isDark ? tokens.colors.dark : tokens.colors.light;

  return createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    palette: {
      mode,
      primary: {
        main: tokens.colors.primary,
        light: tokens.colors.primaryLight,
        dark: tokens.colors.primaryDark,
        contrastText: tokens.colors.white,
      },
      secondary: {
        main: tokens.colors.accent,
        light: tokens.colors.accentLight,
        dark: tokens.colors.accentDark,
        contrastText: tokens.colors.black,
      },
      background: {
        default: modeColors.background,
        paper: modeColors.surface,
      },
      text: {
        primary: modeColors.textPrimary,
        secondary: modeColors.textSecondary,
      },
      divider: modeColors.border,
      success: {
        main: tokens.colors.success,
      },
      error: {
        main: tokens.colors.error,
      },
    },
    typography: {
      fontFamily: tokens.typography.fontFamily,
      h1: { fontWeight: tokens.typography.headingWeight },
      h2: { fontWeight: tokens.typography.headingWeight },
      h3: { fontWeight: tokens.typography.headingWeight },
      h4: { fontWeight: tokens.typography.headingWeight },
      h5: { fontWeight: tokens.typography.headingWeight },
      h6: { fontWeight: tokens.typography.headingWeight },
      body1: { fontWeight: tokens.typography.bodyWeight },
      body2: { fontWeight: tokens.typography.bodyWeight },
      button: { fontWeight: 500, textTransform: "none" },
    },
    spacing: tokens.spacing,
    shape: {
      borderRadius: tokens.borderRadius.small,
    },
    shadows: [
      "none",
      tokens.shadows.subtle,
      tokens.shadows.subtle,
      tokens.shadows.medium,
      tokens.shadows.medium,
      tokens.shadows.medium,
      tokens.shadows.elevated,
      tokens.shadows.elevated,
      tokens.shadows.elevated,
      ...Array(16).fill(tokens.shadows.elevated),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: modeColors.background,
            color: modeColors.textPrimary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.small,
            padding: "8px 16px",
          },
          containedPrimary: {
            "&:hover": {
              backgroundColor: tokens.colors.primaryLight,
            },
          },
          containedSecondary: {
            "&:hover": {
              backgroundColor: tokens.colors.accentLight,
            },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.medium,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.medium,
            boxShadow: tokens.shadows.subtle,
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          root: {
            "& .MuiPaper-root": {
              borderRadius: tokens.borderRadius.large,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: tokens.borderRadius.small,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? tokens.colors.dark.surface
              : tokens.colors.primary,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.small,
          },
        },
      },
    },
  });
};

// Layout constants
export const layout = {
  sidebarWidth: 260,
  sidebarCollapsedWidth: 72,
  topBarHeight: 64,
  bottomNavHeight: 56,
  transitionDuration: "225ms",
};

export const lightTheme = getDesignTokens("light");
export const darkTheme = getDesignTokens("dark");
export { tokens };
export default lightTheme;
