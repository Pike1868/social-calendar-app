// HomeNavBar.js
import React from "react";
import { styled } from "@mui/material/styles";
import {
  AppBar as MuiAppBar,
  Button,
  Link,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../redux/userSlice";

const drawerWidth = 340; // Needs to match drawerWidth of Sidebar

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const HomeNavBar = ({ open, toggleDrawer }) => {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("socialCalToken");
    logoutUser();
    navigate("/");
  };
  return (
    <AppBar position="absolute" open={open}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={toggleDrawer}
          sx={{ marginRight: "36px", ...(open && { display: "none" }) }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Social Calendar
        </Typography>
        {/* Add additional elements like user profile/logout button here */}
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
      </Toolbar>
    </AppBar>
  );
};

export default HomeNavBar;
