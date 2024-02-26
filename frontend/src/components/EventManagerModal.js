import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { format, formatISO, parseISO } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { useDispatch, useSelector } from "react-redux";
import { selectUserDetails, selectUserCalendar } from "../redux/userSlice";
import {
  updateEvent,
  selectCurrentEvent,
  fetchEventsByCalendar,
  removeEvent,
  resetCurrentEvent,
} from "../redux/eventSlice";
import {
  removeGoogleEvent,
  resetCurrentGoogleEvent,
  selectCurrentGoogleEvent,
  updateGoogleEvent,
} from "../redux/googleEventSlice";

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

export default function EventManagerModal({ isModalOpen, toggleModal }) {
  const userCal = useSelector(selectUserCalendar);
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const currentGoogleEvent = useSelector(selectCurrentGoogleEvent);
  const currentEvent = useSelector(selectCurrentEvent);
  const [eventData, setEventData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    location: "",
    description: "",
    status: "",
    time_zone: "",
  });

  useEffect(() => {
    // Decide which event data to use based on the source
    if (currentEvent && !currentGoogleEvent) {
      setEventData(currentEvent);
    } else if (currentGoogleEvent && !currentEvent) {
      setEventData(currentGoogleEvent);
    }
  }, [currentEvent, currentGoogleEvent]);

  //Display event times in users time_zone
  const userTimezone =
    userDetails.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const displayStartTime = eventData.start_time
    ? format(
        utcToZonedTime(parseISO(eventData.start_time), userTimezone),
        "yyyy-MM-dd'T'HH:mm"
      )
    : "";
  const displayEndTime = eventData.end_time
    ? format(
        utcToZonedTime(parseISO(eventData.end_time), userTimezone),
        "yyyy-MM-dd'T'HH:mm"
      )
    : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  //Function to handle update submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, ...updateData } = eventData;
    //Formatting dates to UTC
    const formattedUpdateData = {
      ...updateData,
      start_time: formatISO(new Date(eventData.start_time)),
      end_time: formatISO(new Date(eventData.end_time)),
    };
    if (currentEvent && currentEvent.id) {
      await dispatch(updateEvent({ id, eventData: formattedUpdateData }));
    }
    if (currentGoogleEvent && currentGoogleEvent.id) {
      console.log("EventMangaer sent data to update:");
      await dispatch(updateGoogleEvent({ id, eventData: formattedUpdateData }));
    }
    closeModal();
  };

  // Function to handle event deletion
  const handleDeleteEvent = async () => {
    if (currentEvent && currentEvent.id) {
      await dispatch(removeEvent(currentEvent.id));
    }
    if (currentGoogleEvent && currentGoogleEvent.id) {
      await dispatch(removeGoogleEvent(currentGoogleEvent.id));
    }

    closeModal();
  };

  const closeModal = () => {
    dispatch(fetchEventsByCalendar(userCal.id));
    dispatch(resetCurrentEvent());
    dispatch(resetCurrentGoogleEvent());
    toggleModal();
  };

  return (
    <div>
      <Modal open={isModalOpen} onClose={closeModal}>
        <Box sx={style} component="form" onSubmit={handleSubmit}>
          <IconButton
            onClick={closeModal}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography id="event-modal-title" variant="h6" component="h2">
            Manage Event
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
            value={displayStartTime}
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
            value={displayEndTime}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            id="location"
            label="Location"
            name="location"
            value={eventData.location || ""}
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
            value={eventData.description || ""}
            onChange={handleChange}
          />
          <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
            Update Event
          </Button>
          <Button
            onClick={handleDeleteEvent}
            variant="contained"
            sx={{ mt: 3, mb: 2, ml: 1 }}
            color="error"
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
