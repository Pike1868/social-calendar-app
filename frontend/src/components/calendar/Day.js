import React from "react";
import { Box, Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { selectEvents } from "../../redux/eventSlice";
import dayjs from "dayjs";

export default function Day({ day }) {
  const events = useSelector(selectEvents);
  const eventsForDay = events.filter((event) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    return day.isSame(startTime, "day") || day.isSame(endTime, "day");
  });
  return (
    <Grid
      item
      sx={{
        border: 1,
        borderColor: "grey",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: "5px",
        aspectRatio: "1.4 / 1",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box>{day && day.format("DD")}</Box>
      <ul>
        {eventsForDay.map((e) => (
          <li key={e.id}>{e.title}</li>
        ))}
      </ul>
    </Grid>
  );
}
