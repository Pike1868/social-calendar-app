import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Drawer,
  Dialog,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotesIcon from "@mui/icons-material/Notes";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";
const EVENT_COLORS = {
  local: { bg: "#1B5E20", label: "Local" },
  google: { bg: "#C6993A", label: "Google" },
  friend: { bg: "#333333", label: "Friend" },
};

export default function EventDetailModal({ open, event, onClose, onEdit }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!event) return null;

  const sourceColor = EVENT_COLORS[event.source] || EVENT_COLORS.local;

  const formatTime = (date) => {
    if (!date) return "";
    return dayjs(date).format("ddd, MMM D, YYYY · h:mm A");
  };

  const content = (
    <Box sx={{ p: isMobile ? 2 : 3, minWidth: isMobile ? "auto" : 360 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ flex: 1, mr: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {event.title}
          </Typography>
          <Chip
            label={sourceColor.label}
            size="small"
            sx={{
              backgroundColor: sourceColor.bg,
              color: event.source === "google" ? "#000" : "#fff",
              fontWeight: 500,
              fontSize: "0.7rem",
              height: 22,
            }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {onEdit && (
            <IconButton onClick={onEdit} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Time */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
        <AccessTimeIcon sx={{ color: "text.secondary", fontSize: 20, mt: 0.25 }} />
        <Box>
          <Typography variant="body2">{formatTime(event.start)}</Typography>
          {event.end && (
            <Typography variant="body2" color="text.secondary">
              to {formatTime(event.end)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Location */}
      {event.location && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <LocationOnIcon sx={{ color: "text.secondary", fontSize: 20, mt: 0.25 }} />
          <Typography variant="body2">{event.location}</Typography>
        </Box>
      )}

      {/* Description */}
      {event.description && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <NotesIcon sx={{ color: "text.secondary", fontSize: 20, mt: 0.25 }} />
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            {event.description}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Mobile: bottom sheet drawer
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "70vh",
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
        {content}
      </Drawer>
    );
  }

  // Desktop: centered dialog
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[8],
        },
      }}
    >
      {content}
    </Dialog>
  );
}
