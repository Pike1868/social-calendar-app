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

/** Component that displays events for each day
 * Handles local and google events separately and allows toggling a modal to view event details
 * 
 * 
 * PROPS:
 * - day: current day for which events are being displayed
 * - toggleModal: Function to toggle visibility of modal that displays event details
 * 
 * 
 * TODO:
 * Allow users to create an event
 * with date pre-populated when a user
 * clicks on a day in the grid
 */

export default function Day({ day, toggleModal }) {
  const dispatch = useDispatch();
  //// State selectors for event visibility and event lists.
  const showGoogleEvents = useSelector(selectShowGoogleEvents);
  const showLocalEvents = useSelector(selectShowLocalEvents);
  const localEventList = useSelector(selectEvents);
  const googleEventList = useSelector(selectAllGoogleEvents);

  // Memoized filtering of local events
  // Filters out events synced with Google if showGoogleEvents is false,
  // and then filters by events that occur on the current day
  const localEventsForDay = React.useMemo(()=>{
    const filteredLocalEvents = showGoogleEvents ?
    localEventList.filter((e) => !e.google_id) : localEventList;
    return filteredLocalEvents.filter((event) => {
      const startTime = dayjs(event.start_time);
      const endTime = dayjs(event.end_time);
      return day.isSame(startTime, "day") || day.isSame(endTime,day);
    });
  }, [day, localEventList, showGoogleEvents])
 
  
  // Memoized filtering of Google events that occur on the current day
  const googleEventsForDay = React.useMemo(()=>{
    return googleEventList.filter((event)=>{
      const startTime = dayjs(event.start_time);
      const endTime = dayjs(event.end_time);
      return day.isSame(startTime, "day") || day.isSame(endTime, "day")
    })

  },[day, googleEventList])

  //Event Handling
  //Handles click on local events, setting the current event and toggling the modal with its details.
  const handleEventClick = (eventId) => {
    dispatch(resetCurrentGoogleEvent());
    dispatch(setCurrentEvent({ id: eventId, source: "local" }));
    toggleModal();
  };
  // Handles click on Google events, similar to handleEventClick but for Google events.
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