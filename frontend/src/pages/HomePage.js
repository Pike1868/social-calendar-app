import React, { useEffect } from "react";
import { Container, Grid } from "@mui/material";
import Calendar from "../components/calendar/Calendar";
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
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Calendar />
        </Grid>
      </Grid>
    </Container>
  );
}
