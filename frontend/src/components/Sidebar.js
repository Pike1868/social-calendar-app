// Sidebar.js
import React from "react";
import {
  Drawer,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  Toolbar,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SmallCalendar from "./SmallCalendar";
import EventModal from "./EventCreatorModal";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleGoogleEventsVisibility,
  selectShowGoogleEvents,
} from "../redux/googleEventSlice";
import {
  toggleLocalEventsVisibility,
  selectShowLocalEvents,
} from "../redux/eventSlice";

function Sidebar({ open, toggleDrawer, drawerWidth }) {
  const dispatch = useDispatch();
  const showLocalEvents = useSelector(selectShowLocalEvents);
  const showGoogleEvents = useSelector(selectShowGoogleEvents);

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
          <Box sx={{ overflow: "auto" }}>
            <br></br>
            <EventModal />
            <SmallCalendar />
            {/* Calendars list can go below */}
            <Box>
              <Typography variant="h6">Calendars:</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showLocalEvents}
                    onChange={() => dispatch(toggleLocalEventsVisibility())}
                  />
                }
                label="Default Calendar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showGoogleEvents}
                    onChange={() => dispatch(toggleGoogleEventsVisibility())}
                  />
                }
                label="Google Calendar"
              />
            </Box>
          </Box>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
