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
import { formatToISO } from '../redux/helpers/dateTimeFormats';
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
import { formatDateTimeForDisplay } from "../redux/helpers/dateTimeFormats";

const DEFAULT_EVENT_DATA = {
  title: "",
  start_time: "",
  end_time: "",
  location: "",
  description: "",
};

export default function EventManagerModal({ isModalOpen, toggleModal }) {
  const userCal = useSelector(selectUserCalendar);
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const currentGoogleEvent = useSelector(selectCurrentGoogleEvent);
  const currentEvent = useSelector(selectCurrentEvent);
  const [eventData, setEventData] = useState(DEFAULT_EVENT_DATA);

  //Display event times in users time_zone
  const userTimezone =
  userDetails.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format to proper dateTime format to display
  useEffect(() => {
    let formattedData = currentEvent || currentGoogleEvent;
    if (formattedData) {
      setEventData({
        ...formattedData,
        start_time: formattedData.start_time ? formatDateTimeForDisplay(formattedData.start_time, userTimezone) : "",
        end_time: formattedData.end_time ? formatDateTimeForDisplay(formattedData.end_time, userTimezone) : "",
      });
    }
  }, [currentEvent, currentGoogleEvent, userTimezone]);
  
  // Handles changes on form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  /** Handles update submission
   * 
   * *If google event has local copy, 
   *  google action will handle both
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, ...updateData } = eventData;
    //Formatting dates to UTC for database
    const formattedUpdateData = {
      ...updateData,
      start_time: formatToISO(eventData.start_time),
    end_time: formatToISO(eventData.end_time),
    };
    if (currentEvent && currentEvent.id) {
      await dispatch(updateEvent({ id, eventData: formattedUpdateData }));
    }
    if (currentGoogleEvent && currentGoogleEvent.id) {
      await dispatch(
        updateGoogleEvent({ google_id: id, eventData: formattedUpdateData })
      );
    }
    closeModal();
  };

  /**Dispatch action to delete event in corresponding system
   * 
   * *If google event has local copy, 
   *  google action will handle both
  */
  const handleDeleteEvent = async () => {
    if (currentGoogleEvent?.id) {
      await dispatch(removeGoogleEvent(currentGoogleEvent.id));
    }
    if (currentEvent?.id) {
      await dispatch(removeEvent(currentEvent.id));
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
        <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
          <IconButton
            onClick={closeModal}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography id="event-modal-title" variant="h6" component="h2">
            Manage Event
          </Typography>

          {renderTextFields()}
          <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
            Update Event
          </Button>
          <Button
            onClick={handleDeleteEvent}
            variant="contained"
            sx={buttonStyle}
            color="error"
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Modal>
    </div>
  );

function renderTextFields(){
  const fields = [
    { name: "title", label: "Event Title", required: true, autoFocus: true },
      {
        name: "start_time",
        label: "Start Time",
        type: "datetime-local",
        required: true,
      },
      {
        name: "end_time",
        label: "End Time",
        type: "datetime-local",
        required: true,
      },
      { name: "location", label: "Location" },
      { name: "description", label: "Description", multiline: true, rows: 4 },
  ];

  return fields.map((field)=>
   ( <TextField
    key={field.name}
    margin="normal"
    fullWidth
    value={eventData[field.name] || ""}
    onChange={handleChange}
    {...field}
    InputLabelProps={
      field.type === "datetime-local" ? {shrink: true} : null
    }
    />)
  )
}
}



const modalStyle = {
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

const buttonStyle = { mt: 3, mb: 2, ml: 1 }