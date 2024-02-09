import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AppBar, Toolbar, Typography, Link } from "@mui/material";


const NavBar = () => {
 
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
        
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
