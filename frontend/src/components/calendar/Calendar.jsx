import React, { useState, useEffect } from "react";
import { Box, Paper } from "@mui/material";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventsByCalendar } from "../../redux/eventSlice";
import { selectEvents } from "../../redux/eventSlice";
import { selectUser } from "../../redux/userSlice";
import EventManagerModal from "../EventManagerModal";

function Calendar() {
  const dispatch = useDispatch();
  const { user, userDetails, userCalendar } = useSelector(selectUser);
  const events = useSelector(selectEvents);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const currentMonth = currentDate.format("MMMM YYYY");
  const [eventModalOpen, setEventModalOpen] = useState(false);

  useEffect(() => {
    if (user && userDetails && userCalendar) {
      dispatch(fetchEventsByCalendar(userCalendar.id));
    }
  }, [dispatch, user, userDetails, userCalendar]);

  const handlePreviousMonth = () => {
    setCurrentDate((current) => current.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate((current) => current.add(1, "month"));
  };

  const toggleModal = () => {
    setEventModalOpen(!eventModalOpen);
  };

  return (
    <Box>
      {eventModalOpen && (
        <EventManagerModal
          isModalOpen={eventModalOpen}
          toggleModal={toggleModal}
        />
      )}
      <Paper
        sx={{
          p: 5,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          toggleModal={toggleModal}
        />
      </Paper>
    </Box>
  );
}

export default Calendar;
