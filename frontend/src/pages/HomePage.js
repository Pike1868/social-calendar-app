import React, { useEffect } from "react";
import { Container, Grid, Box, useMediaQuery, useTheme } from "@mui/material";
import Calendar from "../components/calendar/Calendar";
import ThingsToDoWidget from "../components/ThingsToDoWidget";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchUserDetails,
  selectUser,
  fetchUserCalendars,
} from "../redux/userSlice";
import googleCalendarAPI from "../api/googleCalendarAPI";
import { fetchGoogleEvents } from "../redux/googleEventSlice";

export default function Homepage() {
  const dispatch = useDispatch();
  const { user, userDetails, userCalendar } = useSelector(selectUser);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (user && !userDetails) {
      dispatch(fetchUserDetails(user.id));
    }
  }, [dispatch, user, userDetails]);

  useEffect(() => {
    if (user && userDetails && !userCalendar) {
      dispatch(fetchUserCalendars(user.id));
      googleCalendarAPI.setAccessToken(userDetails.access_token);
      if (userDetails.access_token) {
        dispatch(fetchGoogleEvents(userDetails.access_token));
      }
    }
  }, [dispatch, user, userDetails, userCalendar]);

  return (
    <Container maxWidth="xl" disableGutters>
      {isMobile ? (
        /* Mobile: calendar on top, widget below */
        <Box>
          <Calendar />
          <Box sx={{ px: 2, mt: 2 }}>
            <ThingsToDoWidget />
          </Box>
        </Box>
      ) : (
        /* Desktop: calendar takes most space, widget in sidebar area or below */
        <Grid container spacing={2}>
          <Grid item xs={12} md={8} lg={9}>
            <Calendar />
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            <Box sx={{ pt: 1 }}>
              <ThingsToDoWidget />
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
