import React, { useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  TextField,
  Dialog,
  Drawer,
  IconButton,
  Slide,
  useMediaQuery,
  useTheme,
  Divider,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";
import SyncIcon from "@mui/icons-material/Sync";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { createEvent } from "../redux/eventSlice";
import { selectUser } from "../redux/userSlice";
import { createGoogleEvent } from "../redux/googleEventSlice";

const DEFAULT_EVENT_DATA = {
  title: "",
  start_time: null,
  end_time: null,
  location: "",
  description: "",
};

const DEFAULT_ERRORS = {
  title: "",
  start_time: "",
  end_time: "",
};

export default function EventCreatorModal() {
  const dispatch = useDispatch();
  const { userDetails } = useSelector(selectUser);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);
  const [createOnGoogle, setCreateOnGoogle] = useState(false);
  const [eventData, setEventData] = useState(DEFAULT_EVENT_DATA);
  const [errors, setErrors] = useState(DEFAULT_ERRORS);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setEventData(DEFAULT_EVENT_DATA);
    setErrors(DEFAULT_ERRORS);
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (name, value) => {
    setEventData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = { title: "", start_time: "", end_time: "" };
    let valid = true;

    if (!eventData.title.trim()) {
      newErrors.title = "Event title is required";
      valid = false;
    }
    if (!eventData.start_time || !dayjs(eventData.start_time).isValid()) {
      newErrors.start_time = "Start time is required";
      valid = false;
    }
    if (!eventData.end_time || !dayjs(eventData.end_time).isValid()) {
      newErrors.end_time = "End time is required";
      valid = false;
    }
    if (
      eventData.start_time &&
      eventData.end_time &&
      dayjs(eventData.end_time).isBefore(dayjs(eventData.start_time))
    ) {
      newErrors.end_time = "End time must be after start time";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submissionData = {
      ...eventData,
      start_time: dayjs(eventData.start_time).format(),
      end_time: dayjs(eventData.end_time).format(),
    };

    const action = createOnGoogle ? createGoogleEvent : createEvent;
    dispatch(action(submissionData));
    handleClose();
  };

  const formContent = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: isMobile ? 2 : 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EventIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create Event
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Title */}
      <TextField
        name="title"
        label="Event Title"
        value={eventData.title}
        onChange={handleChange}
        fullWidth
        required
        autoFocus
        error={!!errors.title}
        helperText={errors.title}
        placeholder="What's the occasion?"
      />

      {/* Date/Time Pickers */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: isMobile ? "column" : "row" }}>
        <DateTimePicker
          label="Start Time"
          value={eventData.start_time}
          onChange={(val) => handleDateChange("start_time", val)}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              error: !!errors.start_time,
              helperText: errors.start_time,
            },
          }}
        />
        <DateTimePicker
          label="End Time"
          value={eventData.end_time}
          onChange={(val) => handleDateChange("end_time", val)}
          minDateTime={eventData.start_time || undefined}
          slotProps={{
            textField: {
              fullWidth: true,
              required: true,
              error: !!errors.end_time,
              helperText: errors.end_time,
            },
          }}
        />
      </Box>

      {/* Location */}
      <TextField
        name="location"
        label="Location"
        value={eventData.location}
        onChange={handleChange}
        fullWidth
        placeholder="Add a location"
        InputProps={{
          startAdornment: (
            <LocationOnIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
          ),
        }}
      />

      {/* Description */}
      <TextField
        name="description"
        label="Description"
        value={eventData.description}
        onChange={handleChange}
        fullWidth
        multiline
        rows={3}
        placeholder="Add details about this event"
        InputProps={{
          startAdornment: (
            <NotesIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20, alignSelf: "flex-start", mt: 1 }} />
          ),
        }}
      />

      {/* Google Calendar Sync */}
      {userDetails?.access_token && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 1.5,
            borderRadius: 2,
            backgroundColor: createOnGoogle
              ? "rgba(27, 94, 32, 0.08)"
              : "transparent",
            border: 1,
            borderColor: createOnGoogle ? "primary.main" : "divider",
            transition: "all 0.2s",
          }}
        >
          <SyncIcon
            sx={{
              color: createOnGoogle ? "primary.main" : "text.secondary",
              mr: 1,
              fontSize: 20,
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={createOnGoogle}
                onChange={() => setCreateOnGoogle(!createOnGoogle)}
                color="primary"
                name="createOnGoogle"
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Sync with Google Calendar
              </Typography>
            }
            sx={{ m: 0, flex: 1 }}
          />
        </Box>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        startIcon={<AddIcon />}
        sx={{
          mt: 1,
          py: 1.5,
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        Create Event
      </Button>
    </Box>
  );

  return (
    <>
      <Button onClick={handleOpen} variant="contained" startIcon={<AddIcon />}>
        New Event
      </Button>

      {/* Mobile: Bottom Sheet Drawer */}
      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "90vh",
            },
          }}
        >
          {/* Drag handle */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.divider,
              }}
            />
          </Box>
          {formContent}
        </Drawer>
      ) : (
        /* Desktop: Centered Dialog */
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: theme.shadows[8],
            },
          }}
        >
          {formContent}
        </Dialog>
      )}
    </>
  );
}
