import React, { useState } from "react";
import { Box, Button, Typography, Modal, TextField } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createEvent } from "../redux/eventSlice";
import { formatISO } from "date-fns";
import { selectUser } from "../redux/userSlice";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function EventCreatorModal() {
  const dispatch = useDispatch();
  const { user, userCalendar } = useSelector(selectUser);

  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    location: "",
    description: "",
    status: "",
    time_zone: "",
    color_id: "",
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(eventData);
    const formattedEventData = {
      ...eventData,
      calendar_id: userCalendar.id,
      title: eventData.title,
      start_time: formatISO(new Date(eventData.start_time)),
      end_time: formatISO(new Date(eventData.end_time)),
      owner_id: user.id,
    };

    dispatch(createEvent(formattedEventData));
    console.log(formattedEventData);
    handleClose();
  };

  return (
    <div>
      <Button onClick={handleOpen} variant="contained">
        New Event
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} component="form" onSubmit={handleSubmit}>
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
          <TextField
            margin="normal"
            fullWidth
            id="color_id"
            label="Color ID"
            name="color_id"
            value={eventData.color_id}
            onChange={handleChange}
          />
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
