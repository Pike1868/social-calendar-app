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
import { loginUser, selectUserError, setError } from "../redux/userSlice";

const SignIn = () => {
  const dispatch = useDispatch();
  const error = useSelector(selectUserError);

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(setError(null));
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    try {
      await dispatch(loginUser({ email, password }));
    } catch (err) {
      dispatch(
        setError(err || "An error occurred during sign in, please try again.")
      );
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
            Sign in
          </Typography>

          {error && <Typography color="error">{error}</Typography>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="email"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
              Sign In
            </Button>
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: "green",
                "&:hover": {
                  backgroundColor: "darkgreen",
                },
              }}
            >
              <a
                href="https://social-calendar-app.onrender.com/auth/google"
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
                  Sign in with Google
                </Typography>
              </a>
            </Button>

            <Grid container>
              <Grid item></Grid>
              <Grid item>
                <RouterLink to="/signup" variant="body2">
                  Don't have an account? Sign Up!
                </RouterLink>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default SignIn;
