import React from 'react';
import { Card, CardHeader, CardMedia, CardContent, CardActions, Typography, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {useSelector, useDispatch } from "react-redux";
import { selectUserDetails } from "../redux/userSlice";
import { createEvent } from "../redux/eventSlice";
import { createGoogleEvent } from "../redux/googleEventSlice";

export default function EventCard({ event }) {
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const handleAddToCalendar = () => {
    // Extracting necessary information from the Ticketmaster event
    const eventData = {
      title: event.name,
      start_time: event.dates.start.dateTime,
      end_time: event.dates.end?.dateTime || event.dates.start.dateTime,
      location: event._embedded?.venues?.[0]?.name,
      description: event.info
    };
  
    // dispatch event creation to local calendar or Google Calendar based on user state
    const action = userDetails?.access_token ? createGoogleEvent : createEvent;
  
    dispatch(action(eventData));
  };
  

  // Checking if venue information is available
  const venue = event._embedded?.venues?.[0];

  return (
    <Card sx={{ maxWidth: 345, margin:"1rem" }}>
      <CardHeader
        title={event.name}
        subheader={new Date(event.dates.start.dateTime).toLocaleString()}
      />
      <CardMedia
        component="img"
        height="194"
        image={event.images.find(image => image.ratio === '16_9')?.url || '/default-event-image.jpg'}
        alt={event.name}
      />
      <CardContent>
        {venue ? (
          <Typography variant="body2" color="text.secondary">
            Location: {venue.name}, {venue.city?.name || 'Unknown city'}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Location information not available
          </Typography>
        )}
      </CardContent>
      <CardActions disableSpacing>
        <Button
          size="small"
          variant='contained'
          color="primary"
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{borderRadius:"1rem"}}
        >
          Learn More
        </Button>
        <Chip
          icon={<AddIcon />}
          label="Add To Calendar"
          onClick={handleAddToCalendar}
          color="success" 
          sx={{ cursor: 'pointer', marginLeft: 'auto' }}
        />
      </CardActions>
    </Card>
  );
}

