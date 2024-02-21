import React from "react";
import { Box, Grid, List, ListItem, ListItemText } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectEvents, setCurrentEventId } from "../../redux/eventSlice";

import dayjs from "dayjs";

export default function Day({ day, toggleModal }) {
  const dispatch = useDispatch();
  const eventList = useSelector(selectEvents);
  const eventsForDay = eventList.filter((event) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    return day.isSame(startTime, "day") || day.isSame(endTime, "day");
  });
  const handleEventClick = (eventId) => {
    console.log("event clicked");
    dispatch(setCurrentEventId(eventId));
    toggleModal();
  };

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
      <List>
        {eventsForDay.map((e) => (
          <ListItem button key={e.id} onClick={() => handleEventClick(e.id)}>
            <ListItemText primary={e.title} />
          </ListItem>
        ))}
      </List>
    </Grid>
  );
}
