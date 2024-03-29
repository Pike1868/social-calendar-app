import React, { useState, useEffect } from "react";
import { Box, Container, Grid } from "@mui/material";
import Calendar from "../components/calendar/Calendar";
import Sidebar from "../components/Sidebar";
import HomeNavBar from "../components/HomeNavBar";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchUserDetails,
  selectUser,
  fetchUserCalendars,
} from "../redux/userSlice";
import googleCalendarAPI from "../api/googleCalendarAPI";
import { fetchGoogleEvents } from "../redux/googleEventSlice";

const drawerWidth = 340;

export default function Homepage() {
  const dispatch = useDispatch();
  const { user, userDetails, userCalendar } = useSelector(selectUser);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Fetch userDetails once user is stored
    if (user && !userDetails) {
      dispatch(fetchUserDetails(user.id));
    }
  }, [dispatch, user, userDetails]);

  useEffect(() => {
    // Fetch calendar and events once user and userDetails are available
    if (user && userDetails && !userCalendar) {
      dispatch(fetchUserCalendars(user.id));
      googleCalendarAPI.setAccessToken(userDetails.access_token);
      if (userDetails.access_token) {
        dispatch(fetchGoogleEvents(userDetails.access_token));
      }
    }
  }, [dispatch, user, userDetails, userCalendar]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <HomeNavBar open={open} toggleDrawer={toggleDrawer} />
      <Sidebar
        open={open}
        toggleDrawer={toggleDrawer}
        drawerWidth={drawerWidth}
      />

      <Box
        component="main"
        sx={{ flexGrow: 1, height: "100vh", overflow: "auto" }}
      >
        <Container maxWidth="xl" sx={{ pt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Calendar />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
