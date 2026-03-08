import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  Alert,
  Fade,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GoogleIcon from "@mui/icons-material/Google";
import AuthLayout from "../components/AuthLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  selectUserError,
  setError,
} from "../redux/userSlice";
import { tokens } from "../theme";

const SignIn = () => {
  const dispatch = useDispatch();
  const error = useSelector(selectUserError);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(setError(null));
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    setLoading(true);
    try {
      await dispatch(loginUser({ email, password }));
    } catch (err) {
      dispatch(
        setError(err || "An error occurred during sign in, please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Fade in timeout={400}>
        <Box>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 600,
              textAlign: "center",
              mb: 1,
              color: "text.primary",
            }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "text.secondary",
              mb: 5,
            }}
          >
            Sign in to continue to Circl
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 4,
                borderRadius: 2,
                "& .MuiAlert-message": { fontSize: "0.875rem" },
              }}
              onClose={() => dispatch(setError(null))}
            >
              {error}
            </Alert>
          )}

          {/* Primary CTA: Continue with Google */}
          <Button
            component="a"
            href={`${process.env.REACT_APP_SERVER_URL}/auth/google`}
            fullWidth
            variant="contained"
            size="large"
            startIcon={
              <GoogleIcon sx={{ color: tokens.colors.accent, fontSize: 22 }} />
            }
            sx={{
              py: 3,
              bgcolor: "primary.main",
              color: tokens.colors.white,
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              borderRadius: 2.5,
              textTransform: "none",
              boxShadow: tokens.shadows.medium,
              "&:hover": {
                bgcolor: "primary.light",
                boxShadow: tokens.shadows.elevated,
              },
            }}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <Divider
            sx={{
              my: 4,
              color: "text.secondary",
              fontSize: "0.75rem",
              "&::before, &::after": {
                borderColor: "divider",
              },
            }}
          >
            or sign in with email
          </Divider>

          {/* Secondary: Email/Password form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="dense"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              variant="outlined"
              size="small"
              sx={{ mb: 3 }}
            />
            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              variant="outlined"
              size="small"
              sx={{ mb: 4 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              size="large"
              disabled={loading}
              sx={{
                py: 2.5,
                borderRadius: 2.5,
                fontWeight: 500,
                fontSize: "0.9rem",
                textTransform: "none",
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "transparent",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="primary" />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>

          {/* Toggle to sign up */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 4,
              color: "text.secondary",
            }}
          >
            Don't have an account?{" "}
            <Typography
              component={RouterLink}
              to="/signup"
              variant="body2"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Sign Up
            </Typography>
          </Typography>
        </Box>
      </Fade>
    </AuthLayout>
  );
};

export default SignIn;
