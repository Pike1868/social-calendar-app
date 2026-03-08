import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventsByCalendar } from "../../redux/eventSlice";
import { selectUser } from "../../redux/userSlice";
import CalendarView from "./CalendarView";

function Calendar() {
  const dispatch = useDispatch();
  const { user, userDetails, userCalendar } = useSelector(selectUser);

  useEffect(() => {
    if (user && userDetails && userCalendar) {
      dispatch(fetchEventsByCalendar(userCalendar.id));
    }
  }, [dispatch, user, userDetails, userCalendar]);

  return (
    <Box sx={{ height: "100%" }}>
      <CalendarView />
    </Box>
  );
}

export default Calendar;
