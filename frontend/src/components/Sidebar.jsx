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
import { selectUserDetails } from "../redux/userSlice";

function Sidebar({ open, toggleDrawer, drawerWidth }) {
  const dispatch = useDispatch();
  const showLocalEvents = useSelector(selectShowLocalEvents);
  const showGoogleEvents = useSelector(selectShowGoogleEvents);
  const userDetails = useSelector(selectUserDetails);

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
          </Box>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
