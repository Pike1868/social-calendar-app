import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Dialog,
  Drawer,
  Divider,
  useMediaQuery,
  useTheme,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { formatToISO } from "../redux/helpers/dateTimeFormats";
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

export default function EventManagerModal({ isModalOpen, toggleModal }) {
  const userCal = useSelector(selectUserCalendar);
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const currentGoogleEvent = useSelector(selectCurrentGoogleEvent);
  const currentEvent = useSelector(selectCurrentEvent);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [eventData, setEventData] = useState(DEFAULT_EVENT_DATA);
  const [errors, setErrors] = useState(DEFAULT_ERRORS);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const userTimezone =
    userDetails?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    let formattedData = currentEvent || currentGoogleEvent;
    if (formattedData) {
      setEventData({
        ...formattedData,
        start_time: formattedData.start_time
          ? dayjs(formatDateTimeForDisplay(formattedData.start_time, userTimezone))
          : null,
        end_time: formattedData.end_time
          ? dayjs(formatDateTimeForDisplay(formattedData.end_time, userTimezone))
          : null,
      });
    }
  }, [currentEvent, currentGoogleEvent, userTimezone]);

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

    if (!eventData.title || !eventData.title.trim()) {
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

    const { id, ...updateData } = eventData;
    const formattedUpdateData = {
      ...updateData,
      start_time: dayjs(eventData.start_time).format(),
      end_time: dayjs(eventData.end_time).format(),
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

  const handleDeleteEvent = async () => {
    setDeleteConfirmOpen(false);

    if (currentGoogleEvent?.id) {
      await dispatch(removeGoogleEvent(currentGoogleEvent.id));
    }
    if (currentEvent?.id) {
      await dispatch(removeEvent(currentEvent.id));
    }

    closeModal();
  };

  const closeModal = () => {
    setErrors(DEFAULT_ERRORS);
    dispatch(fetchEventsByCalendar(userCal.id));
    dispatch(resetCurrentEvent());
    dispatch(resetCurrentGoogleEvent());
    toggleModal();
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
          <EditIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Event
          </Typography>
        </Box>
        <IconButton onClick={closeModal} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Title */}
      <TextField
        name="title"
        label="Event Title"
        value={eventData.title || ""}
        onChange={handleChange}
        fullWidth
        required
        autoFocus
        error={!!errors.title}
        helperText={errors.title}
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
        value={eventData.location || ""}
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
        value={eventData.description || ""}
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

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          sx={{ flex: 1, py: 1.5, fontWeight: 600 }}
        >
          Save Changes
        </Button>
        <Button
          onClick={() => setDeleteConfirmOpen(true)}
          variant="outlined"
          color="error"
          size="large"
          startIcon={<DeleteIcon />}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          Delete
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile: Bottom Sheet Drawer */}
      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={isModalOpen}
          onClose={closeModal}
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
          open={isModalOpen}
          onClose={closeModal}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            maxWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <WarningAmberIcon sx={{ color: "error.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Event
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{eventData.title}&rdquo;? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteEvent}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
