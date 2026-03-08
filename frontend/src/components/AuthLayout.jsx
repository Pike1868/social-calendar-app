import React from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

/**
 * Shared layout for Sign In / Sign Up pages.
 * White background, subtle geometric gold/green accents, branding, and trust messaging.
 */
const AuthLayout = ({ children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        bgcolor: isDark ? "background.default" : tokens.colors.white,
      }}
    >
      {/* Decorative geometric accents */}
      {/* Top-right circle */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: -80, md: -120 },
          right: { xs: -80, md: -60 },
          width: { xs: 200, md: 320 },
          height: { xs: 200, md: 320 },
          borderRadius: "50%",
          border: `2px solid ${
            isDark
              ? "rgba(198, 153, 58, 0.15)"
              : "rgba(198, 153, 58, 0.2)"
          }`,
          pointerEvents: "none",
        }}
      />
      {/* Bottom-left circle */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: -100, md: -140 },
          left: { xs: -100, md: -80 },
          width: { xs: 240, md: 360 },
          height: { xs: 240, md: 360 },
          borderRadius: "50%",
          border: `2px solid ${
            isDark
              ? "rgba(27, 94, 32, 0.15)"
              : "rgba(27, 94, 32, 0.12)"
          }`,
          pointerEvents: "none",
        }}
      />
      {/* Diagonal accent line */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: "15%", md: "20%" },
          left: { xs: -40, md: -20 },
          width: { xs: 160, md: 240 },
          height: 1,
          background: isDark
            ? "linear-gradient(90deg, transparent, rgba(198, 153, 58, 0.2), transparent)"
            : "linear-gradient(90deg, transparent, rgba(198, 153, 58, 0.25), transparent)",
          transform: "rotate(-25deg)",
          pointerEvents: "none",
        }}
      />
      {/* Small accent dot */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: "70%", md: "65%" },
          right: { xs: "10%", md: "12%" },
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: isDark
            ? "rgba(198, 153, 58, 0.25)"
            : "rgba(198, 153, 58, 0.35)",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: { xs: 6, sm: 8, md: 10 },
          px: { xs: 5, sm: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Branding */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            letterSpacing: "-0.02em",
            mb: 1,
            fontSize: { xs: "2rem", sm: "2.5rem" },
          }}
        >
          Circl
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: { xs: 5, sm: 6 },
            textAlign: "center",
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Stay close to the people who matter
        </Typography>

        {/* Auth card */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            bgcolor: isDark ? "background.paper" : tokens.colors.white,
            borderRadius: 4,
            p: { xs: 5, sm: 7 },
            boxShadow: isDark ? tokens.shadows.medium : tokens.shadows.subtle,
            border: `1px solid ${
              isDark ? tokens.colors.dark.border : "rgba(0,0,0,0.06)"
            }`,
          }}
        >
          {children}
        </Box>

        {/* Trust messaging */}
        <Box
          sx={{
            mt: { xs: 4, sm: 5 },
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            maxWidth: 420,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "primary.main",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.75rem", sm: "0.8125rem" },
              lineHeight: 1.5,
            }}
          >
            We only see when you're free — never your event details
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;
