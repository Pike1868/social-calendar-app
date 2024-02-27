import React, { useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Modal,
  TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createEvent } from "../redux/eventSlice";
import { selectUser } from "../redux/userSlice";
import { createGoogleEvent } from "../redux/googleEventSlice";

export default function EventCreatorModal() {
  const dispatch = useDispatch();
  const { userDetails } = useSelector(selectUser);
  const [open, setOpen] = useState(false);
  const [createOnGoogle, setCreateOnGoogle] = useState(false);
  const [eventData, setEventData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    location: "",
    description: "",
    status: "",
    time_zone: "",
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setEventData({
      title: "",
      start_time: "",
      end_time: "",
      location: "",
      description: "",
      status: "",
      time_zone: "",
    });

    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  /**
   * Events are always created locally by default, can be created in google calendar if user selected "sync with google calendar"
   *
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (createOnGoogle) {
      dispatch(createGoogleEvent(eventData));
      handleClose();
      return;
    } else {
      dispatch(createEvent(eventData));
      handleClose();
    }
  };

  return (
    <div>
      <Button onClick={handleOpen} variant="contained">
        New Event
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
          }}
          component="form"
          onSubmit={handleSubmit}
        >
          <Typography id="event-modal-title" variant="h6" component="h2">
            Create New Event
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Event Title"
            name="title"
            autoFocus
            value={eventData.title}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="start_time"
            label="Start Time"
            name="start_time"
            type="datetime-local"
            InputLabelProps={{
              shrink: true,
            }}
            value={eventData.start_time}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="end_time"
            label="End Time"
            name="end_time"
            type="datetime-local"
            InputLabelProps={{
              shrink: true,
            }}
            value={eventData.end_time}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="location"
            label="Location"
            name="location"
            value={eventData.location}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={eventData.description}
            onChange={handleChange}
          />
          {userDetails && userDetails.access_token && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={createOnGoogle}
                  onChange={() => setCreateOnGoogle(!createOnGoogle)}
                  name="createOnGoogle"
                  color="primary"
                />
              }
              label="Sync event with Google Calendar"
            />
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Create Event
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
