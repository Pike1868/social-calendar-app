import React from "react";
import { Box, Typography, IconButton, Grid } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

function CalendarHeader({ currentMonth, onPreviousMonth, onNextMonth }) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
        }}
      >
        <IconButton onClick={onPreviousMonth}>
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography variant="h5">{currentMonth}</Typography>
        <IconButton onClick={onNextMonth}>
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}
      >
        {daysOfWeek.map((d) => (
          <Grid item key={d}>
            <Typography variant="h5">{d}</Typography>
          </Grid>
        ))}
      </Box>
    </>
  );
}

export default CalendarHeader;
