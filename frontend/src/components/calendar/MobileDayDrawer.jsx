import React from "react";
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

const EVENT_COLORS = {
  local: "#1B5E20",
  google: "#C6993A",
  friend: "#333333",
};

export default function MobileDayDrawer({ open, date, events, onClose, onEventClick }) {
  const theme = useTheme();

  if (!date) return null;

  const formattedDate = dayjs(date).format("dddd, MMMM D, YYYY");

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "60vh",
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.divider,
          }}
        />
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 1.5,
          pb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {formattedDate}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Event list */}
      {events.length === 0 ? (
        <Box sx={{ px: 2, pb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No events this day.
          </Typography>
        </Box>
      ) : (
        <List sx={{ px: 1, pb: 2 }}>
          {events.map((event) => {
            const source = event.extendedProps?.source || "local";
            const color = EVENT_COLORS[source];
            const startTime = dayjs(event.start).format("h:mm A");
            const endTime = event.end ? dayjs(event.end).format("h:mm A") : "";

            return (
              <ListItemButton
                key={event.id}
                onClick={() => onEventClick(event)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  borderLeft: `4px solid ${color}`,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {event.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {startTime}{endTime ? ` – ${endTime}` : ""}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Drawer>
  );
}
