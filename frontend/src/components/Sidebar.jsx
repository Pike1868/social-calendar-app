import React, { useState } from "react";
import {
  Drawer,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  TextField,
  IconButton,
  Toolbar,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EventModal from "./EventCreatorModal";
import EventCard from "./TicketMasterEventCard"; 
import { useDispatch, useSelector } from "react-redux";
import {
  toggleGoogleEventsVisibility,
  selectShowGoogleEvents,
} from "../redux/googleEventSlice";
import {
  toggleLocalEventsVisibility,
  selectShowLocalEvents,
} from "../redux/eventSlice";
import { selectUserDetails } from "../redux/userSlice";
import TicketmasterAPI from "../api/ticketMasterAPI";

function Sidebar({ open, toggleDrawer, drawerWidth }) {
  const dispatch = useDispatch();
  const showLocalEvents = useSelector(selectShowLocalEvents);
  const showGoogleEvents = useSelector(selectShowGoogleEvents);
  const userDetails = useSelector(selectUserDetails);
  const [searchQuery, setSearchQuery] = useState("");
  const [tmEvents, setTmEvents] = useState([]);

  async function fetchTMEventsList() {
    let tmEventsList;
    // Format the current date as ISO 8601 string
    // Gets the date portion in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]; 
    const startDateTime = `${today}T00:00:00Z`;
    try {
      if (searchQuery) {
        // If there's a search query, search for events by keyword
        // and current day as startDateTime
        tmEventsList = await TicketmasterAPI.searchEvents({
          keyword: searchQuery,
          startDateTime: startDateTime
        });
      } else {
        // Otherwise, fetch default events in the US
        tmEventsList = await TicketmasterAPI.fetchEventsInUS();
      }
      
      // Checking that _embedded.events exists before filtering
      const validEvents = tmEventsList._embedded?.events?.filter(event => {
        const dateTime = event.dates.start.dateTime;
        // Check if the dateTime exists and is a valid date
        return dateTime && !isNaN(Date.parse(dateTime));
      }) || [];
  
      setTmEvents(validEvents);
    } catch (err) {
      console.error("Error fetching events", err);
      //Set events to empty array if no results found
      setTmEvents([]);
    }
  }
  
  
  
  return (
    <>
      {open && (
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <Box sx={{  overflow: "auto", flex: '1' }}>
            <br></br>
            <Stack spacing={2} sx={{ p: 2 }}> 
            <EventModal />
            <Box sx={{ mt: 8 }}>
              <Typography variant="h6">Calendars:</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showLocalEvents}
                    onChange={() => dispatch(toggleLocalEventsVisibility())}
                  />
                }
                label="Local Calendar"
              />
              <br></br>
              {userDetails && userDetails.access_token && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showGoogleEvents}
                      onChange={() => dispatch(toggleGoogleEventsVisibility())}
                    />
                  }
                  label="Google Calendar"
                />
              )}
            </Box>
          <Divider/>
            <Typography variant="h5" sx={{ marginTop: 2 }}>Search Ticketmaster Events:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Search events (name, location, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTMEventsList()}
              sx={{ marginBottom: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={fetchTMEventsList}
              sx={{ marginBottom: 2 }}
            >
              Search
            </Button>
             {tmEvents.length > 0 ? (
                tmEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <Typography sx={{ textAlign: 'center', marginTop: '20px' }}>
                  No events found. Try another search.
                </Typography>
              )}
               </Stack>
          </Box>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
