// HomeNavBar.js
import React from "react";
import {
  AppBar,
  Button,
  Link,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";
import { resetState } from "../redux/helpers/globalActions";

const HomeNavBar = ({ open, toggleDrawer }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("socialCalToken");
    dispatch(setUser(null));
    dispatch(resetState());
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
