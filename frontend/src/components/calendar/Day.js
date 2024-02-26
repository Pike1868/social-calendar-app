import React from "react";
import { Box, Grid, List, ListItem, ListItemText } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import {
  resetCurrentEvent,
  selectEvents,
  setCurrentEvent,
  selectShowLocalEvents,
} from "../../redux/eventSlice";
import {
  resetCurrentGoogleEvent,
  selectAllGoogleEvents,
  setCurrentGoogleEvent,
  selectShowGoogleEvents,
} from "../../redux/googleEventSlice";

import dayjs from "dayjs";

export default function Day({ day, toggleModal }) {
  const dispatch = useDispatch();
  const showGoogleEvents = useSelector(selectShowGoogleEvents);
  const showLocalEvents = useSelector(selectShowLocalEvents);

  //Local events
  const localEventList = useSelector(selectEvents);
  const localEventsForDay = localEventList.filter((event) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    return day.isSame(startTime, "day") || day.isSame(endTime, "day");
  });

  //Google events
  const googleEventList = useSelector(selectAllGoogleEvents);
  const googleEventsForDay = googleEventList.filter((event) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    return day.isSame(startTime, "day") || day.isSame(endTime, "day");
  });

  //Event Handling
  const handleEventClick = (eventId) => {
    dispatch(resetCurrentGoogleEvent());
    dispatch(setCurrentEvent({ id: eventId, source: "local" }));
    toggleModal();
  };
  const handleGoogleEventClick = (eventId) => {
    dispatch(resetCurrentEvent());
    dispatch(setCurrentGoogleEvent({ id: eventId, source: "google" }));
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
        {showLocalEvents &&
          localEventsForDay.map((e) => (
            <ListItem
              button
              key={e.id}
              onClick={() => handleEventClick(e.id)}
              sx={{ backgroundColor: "lightblue" }}
            >
              <ListItemText primary={e.title} />
            </ListItem>
          ))}
        {showGoogleEvents &&
          googleEventsForDay.map((e) => (
            <ListItem
              button
              key={e.id}
              onClick={() => handleGoogleEventClick(e.id)}
              sx={{ backgroundColor: "lightgreen" }}
            >
              <ListItemText primary={e.title} />
            </ListItem>
          ))}
      </List>
    </Grid>
  );
}
