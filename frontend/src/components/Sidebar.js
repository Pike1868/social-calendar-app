// Sidebar.js
import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Toolbar,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SmallCalendar from "./SmallCalendar";

function Sidebar({ open, toggleDrawer, drawerWidth }) {
  return (
    <>
      {open && (
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <Box sx={{ overflow: "auto" }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              SIDEBAR
            </Typography>
            <SmallCalendar />
            {/* Calendars list can go below */}
          </Box>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
