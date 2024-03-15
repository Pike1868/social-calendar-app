import React from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Typography,
  TextField,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import NavBar from "../components/NavBar";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, setError, selectUserError } from "../redux/userSlice";
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const SignUp = () => {
  const dispatch = useDispatch();
  const error = useSelector(selectUserError);

  const formFieldNames = {
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email Address",
    password: "Password",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let newUser = {
      first_name: data.get("first_name"),
      last_name: data.get("last_name"),
      email: data.get("email"),
      password: data.get("password"),
      time_zone: userTimeZone,
    };

    //Check for empty fields
    for (let key in newUser) {
      if (newUser[key].trim() === "") {
        dispatch(setError(`Please enter your ${formFieldNames[key]}.`));
        return;
      }
    }
    //Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      dispatch(setError("Please enter a valid email address."));
      return;
    }

    //Check password length
    if (newUser.password.length < 5) {
      dispatch(setError("Password must be at least 5 characters long."));
      return;
    }

    try {
      await dispatch(registerUser(newUser));
    } catch (err) {
      console.log(err);
      // Default error message
      let errorMessage = "An unexpected error occurred during registration.";

      // Handle different error structures
      if (Array.isArray(err) && err.length > 0) {
        errorMessage = err[0];
      } else if (typeof err === "object" && err.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      //set error in redux store
      dispatch(setError(errorMessage));
    }
  };

  return (
    <>
      <NavBar />

      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "#253031", p: 2 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>

          {error && <Typography color="error">{error}</Typography>}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="first_name"
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                  autoFocus
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
                />
              </Grid>
            </Grid>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
              Sign Up
            </Button>
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 3,
                backgroundColor: "green",
                "&:hover": {
                  backgroundColor: "darkgreen",
                },
              }}
            >
              <a
                href={`${process.env.REACT_APP_SERVER_URL}/auth/google`}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  color: "inherit",
                }}
              >
                <GoogleIcon sx={{ mr: 1 }} />
                <Typography
                  variant="button"
                  sx={{ textTransform: "uppercase" }}
                >
                  Sign up with Google
                </Typography>
              </a>
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item></Grid>
              <Grid item>
                <RouterLink to="/signin" variant="body2">
                  Already have an account? Sign in
                </RouterLink>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default SignUp;
