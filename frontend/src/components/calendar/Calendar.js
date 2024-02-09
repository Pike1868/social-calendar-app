import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import dayjs from "dayjs";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const currentMonth = currentDate.format("MMMM YYYY");

  const handlePreviousMonth = () => {
    setCurrentDate((current) => current.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate((current) => current.add(1, "month"));
  };

  return (
    <Box>
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
        <CalendarGrid currentDate={currentDate} />
      </Paper>
    </Box>
  );
}

export default Calendar;
