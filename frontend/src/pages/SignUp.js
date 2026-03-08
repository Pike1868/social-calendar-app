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
  Grid,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import GoogleIcon from "@mui/icons-material/Google";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import AuthLayout from "../components/AuthLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  registerUser,
  setError,
  selectUserError,
} from "../redux/userSlice";
import { tokens } from "../theme";
import serverAPI from "../api/serverAPI";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const SignUp = () => {
  const dispatch = useDispatch();
  const error = useSelector(selectUserError);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const [inviteInfo, setInviteInfo] = useState(null);

  // Validate invite code on mount
  React.useEffect(() => {
    if (inviteCode) {
      serverAPI.validateInviteCode(inviteCode).then((result) => {
        if (result.valid) {
          setInviteInfo(result);
        }
      }).catch(() => {
        // Silently ignore validation errors
      });
    }
  }, [inviteCode]);

  const formFieldNames = {
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email Address",
    password: "Password",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(setError(null));
    const data = new FormData(event.currentTarget);
    let newUser = {
      first_name: data.get("first_name"),
      last_name: data.get("last_name"),
      email: data.get("email"),
      password: data.get("password"),
      time_zone: userTimeZone,
    };

    // Check for empty fields
    for (let key in newUser) {
      if (newUser[key].trim() === "") {
        dispatch(setError(`Please enter your ${formFieldNames[key]}.`));
        return;
      }
    }
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      dispatch(setError("Please enter a valid email address."));
      return;
    }
    // Check password length
    if (newUser.password.length < 5) {
      dispatch(setError("Password must be at least 5 characters long."));
      return;
    }

    setLoading(true);
    try {
      await dispatch(registerUser(newUser));
    } catch (err) {
      let errorMessage = "An unexpected error occurred during registration.";
      if (Array.isArray(err) && err.length > 0) {
        errorMessage = err[0];
      } else if (typeof err === "object" && err.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      dispatch(setError(errorMessage));
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
            Create your account
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "text.secondary",
              mb: 5,
            }}
          >
            Join Circl and reconnect with your people
          </Typography>

          {inviteInfo && (
            <Alert
              severity="info"
              icon={<PersonAddOutlinedIcon />}
              sx={{
                mb: 4,
                borderRadius: 2,
                "& .MuiAlert-message": { fontSize: "0.875rem" },
              }}
            >
              Invited by <strong>{inviteInfo.inviter_name}</strong>
            </Alert>
          )}

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
            href={`${process.env.REACT_APP_SERVER_URL}/auth/google${inviteCode ? `?invite=${inviteCode}` : ""}`}
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
            or sign up with email
          </Divider>

          {/* Secondary: Email/Password form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="first_name"
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  autoComplete="family-name"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              size="large"
              disabled={loading}
              sx={{
                mt: 4,
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
                "Create Account"
              )}
            </Button>
          </Box>

          {/* Toggle to sign in */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 4,
              color: "text.secondary",
            }}
          >
            Already have an account?{" "}
            <Typography
              component={RouterLink}
              to="/signin"
              variant="body2"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Sign In
            </Typography>
          </Typography>
        </Box>
      </Fade>
    </AuthLayout>
  );
};

export default SignUp;
