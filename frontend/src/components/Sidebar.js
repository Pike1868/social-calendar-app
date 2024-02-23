// Sidebar.js
import React from "react";
import {
  Drawer,
  Box,
  Button,
  Typography,
  IconButton,
  Toolbar,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SmallCalendar from "./SmallCalendar";
import EventModal from "./EventCreatorModal";
import { useDispatch, useSelector } from "react-redux";
import { selectUserDetails } from "../redux/userSlice";
import { fetchGoogleEvents } from "../redux/googleEventSlice";
import googleCalendarAPI from "../api/googleCalendarAPI";

function Sidebar({ open, toggleDrawer, drawerWidth }) {
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();

  const handleFetchGoogleEvents = async () => {
    if (userDetails.access_token && googleCalendarAPI.accessToken) {
      dispatch(fetchGoogleEvents(userDetails.access_token));
    }
  };

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
            <EventModal />
            <SmallCalendar />
            {/* Calendars list can go below */}
            <Box>
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={handleFetchGoogleEvents}
              >
                Fetch Google Events
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
