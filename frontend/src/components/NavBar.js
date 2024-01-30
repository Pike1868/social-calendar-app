import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

const NavBar = () => {
  const { user, setUser } = useUserContext();
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("socialCalToken");
    setUser(null);
    navigate("/");
  };
  return (
    <AppBar
      position="static"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#000",
        maxWidth: "100%",
      }}
    >
      <Link component={RouterLink} to="/" style={{ textDecoration: "none" }}>
        <Typography
          variant="h4"
          component="div"
          sx={{ margin: "1rem", fontWeight: "700" }}
          href="/"
        >
          Social Calendar
        </Typography>
      </Link>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        {user && (
          <>
            <Link
              component={RouterLink}
              to="/profile"
              color="inherit"
              style={{ margin: "0 10px" }}
            >
              <Button color="inherit" style={{ fontWeight: "600" }}>
                Profile
              </Button>
            </Link>
            <Button
              color="inherit"
              style={{ fontWeight: "600", margin: "0 10px" }}
              onClick={logout}
            >
              Log Out
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
