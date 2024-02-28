import React from 'react';
import { Box, Grid, List, ListItem, ListItemText } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
  resetCurrentEvent,
  selectEvents,
  setCurrentEvent,
  selectShowLocalEvents,
} from '../../redux/eventSlice';
import {
  resetCurrentGoogleEvent,
  selectAllGoogleEvents,
  setCurrentGoogleEvent,
  selectShowGoogleEvents,
} from '../../redux/googleEventSlice';
import { isSameDay, parseISO } from 'date-fns';

/**
 * Day component lists all local and google events 
 * and handles toggle eventMangerModal for that event.
 * 
 * TODO:
 * Tests
 * Allow users to create an event
 * with date pre-populated when a user
 * clicks on a day in the grid
 */

export default function Day({ day, toggleModal }) {
  const dispatch = useDispatch();
  const showGoogleEvents = useSelector(selectShowGoogleEvents);
  const showLocalEvents = useSelector(selectShowLocalEvents);

  // Local events, filtering out any local events synced with google and by the day's date
  const localEventList = useSelector(selectEvents);
  const googleEventList = useSelector(selectAllGoogleEvents);

  // Memoized selector for filtering events based on the day
  const getEventsForDay = React.useMemo(() => {
    return (events) => {
      return events.filter((event) => {
        const startTime = parseISO(event.start_time);
        const endTime = parseISO(event.end_time);
        return isSameDay(day, startTime) || isSameDay(day, endTime);
      });
    };
  }, [day]);

  // Filter local events for the day
  const localEventsForDay = React.useMemo(() => {
    return getEventsForDay(
      showGoogleEvents ? localEventList.filter((e) => !e.google_id) : localEventList
    );
  }, [localEventList, showGoogleEvents, getEventsForDay]);

  // Filter google events for the day
  const googleEventsForDay = React.useMemo(() => {
    return getEventsForDay(googleEventList);
  }, [googleEventList, getEventsForDay]);

  // Event Handling
  const handleEventClick = (eventId) => {
    dispatch(resetCurrentGoogleEvent());
    dispatch(setCurrentEvent({ id: eventId, source: 'local' }));
    toggleModal();
  };

  const handleGoogleEventClick = (eventId) => {
    dispatch(resetCurrentEvent());
    dispatch(setCurrentGoogleEvent({ id: eventId, source: 'google' }));
    toggleModal();
  };

  return (
    <Grid
      item
      sx={{
        border: 1,
        borderColor: 'grey',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: '5px',
        aspectRatio: '1.4 / 1',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box>{day && day.format('DD')}</Box>
      <List>
        {showLocalEvents &&
          localEventsForDay.map((e) => (
            <ListItem
              button
              key={e.id}
              onClick={() => handleEventClick(e.id)}
              sx={{ backgroundColor: 'lightblue' }}
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
              sx={{ backgroundColor: 'lightgreen' }}
            >
              <ListItemText primary={e.title} />
            </ListItem>
          ))}
      </List>
    </Grid>
  );
}
