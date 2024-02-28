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

const DEFAULT_EVENT_DATA = {
  title: "",
  start_time: "",
  end_time: "",
  location: "",
  description: "",
  status: "",
  time_zone: "",
};

export default function EventCreatorModal() {
  const dispatch = useDispatch();
  const { userDetails } = useSelector(selectUser);

  const [open, setOpen] = useState(false);
  const [createOnGoogle, setCreateOnGoogle] = useState(false);
  const [eventData, setEventData] = useState(DEFAULT_EVENT_DATA);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setEventData(DEFAULT_EVENT_DATA);
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const action = createOnGoogle ? createGoogleEvent : createEvent;

    dispatch(action(eventData));
    handleClose();
  };

  return (
    <>
      <Button onClick={handleOpen} variant="contained">
        New Event
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Create New Event
          </Typography>
          <form onSubmit={handleSubmit}>
            {renderTextFields()}
            {renderSyncWithGoogleCheckbox()}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={buttonStyle}
            >
              Create Event
            </Button>
          </form>
        </Box>
      </Modal>
    </>
  );

  function renderTextFields() {
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

    return fields.map((field) => (
      <TextField
        key={field.name}
        margin="normal"
        fullWidth
        value={eventData[field.name]}
        onChange={handleChange}
        {...field}
        InputLabelProps={
          field.type === "datetime-local" ? { shrink: true } : null
        }
      />
    ));
  }

  function renderSyncWithGoogleCheckbox() {
    return (
      userDetails?.access_token && (
        <FormControlLabel
          control={
            <Checkbox
              checked={createOnGoogle}
              onChange={() => setCreateOnGoogle(!createOnGoogle)}
              color="primary"
              name="createOnGoogle"
            />
          }
          label="Sync event with Google Calendar"
        />
      )
    );
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

const buttonStyle = {
  mt: 3,
  mb: 2,
};
