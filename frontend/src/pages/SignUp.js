import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Link,
  Typography,
  TextField,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import serverApi from "../api/serverApi";
import { jwtDecode } from "jwt-decode";
import { useUserContext } from "../context/UserContext";
import NavBar from "../components/NavBar";

const SignUp = () => {
  const { setUser } = useUserContext();
  const [error, setError] = useState("");

  const formFieldNames = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    password: "Password",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let newUser = {
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      password: data.get("password"),
    };

    //Check for empty fields
    for (let key in newUser) {
      if (newUser[key].trim() === "") {
        setError(`Please enter your ${formFieldNames[key]}.`);
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    //Check password length
    if (newUser.password.length < 5) {
      setError("Password must be at least 5 characters long.");
      return;
    }

    try {
      const token = await serverApi.register(newUser);
      const decoded = jwtDecode(token);
      if (decoded) {
        setUser({ id: decoded.id });
      }
    } catch (err) {
      let msg = err[0];
      setError(msg);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("socialCalToken", token);
      const decoded = jwtDecode(token);
      setUser({ id: decoded.id, email: decoded.email });
    }
  }, [setUser]);

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
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Button fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                  <Link
                    href="http://localhost:3001/auth/google"
                    underline="none"
                    color="inherit"
                  >
                    Sign up with Google
                  </Link>
                </Button>
              </Grid>
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
