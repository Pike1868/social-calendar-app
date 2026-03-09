import React, { useState, useEffect } from "react";
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
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotesIcon from "@mui/icons-material/Notes";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";

import RestaurantIcon from "@mui/icons-material/Restaurant";
import ParkIcon from "@mui/icons-material/Park";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import PlaceIcon from "@mui/icons-material/Place";
import dayjs from "dayjs";
import serverAPI from "../../api/serverAPI";
import { tokens } from "../../theme";
function getCategoryIcon(category) {
  if (!category) return PlaceIcon;
  const lower = category.toLowerCase();
  if (lower.includes("restaurant") || lower.includes("food")) return RestaurantIcon;
  if (lower.includes("bar") || lower.includes("nightlife") || lower.includes("pub")) return LocalBarIcon;
  if (lower.includes("park") || lower.includes("garden") || lower.includes("outdoor")) return ParkIcon;
  if (
    lower.includes("cinema") ||
    lower.includes("theatre") ||
    lower.includes("theater") ||
    lower.includes("museum") ||
    lower.includes("entertainment")
  )
    return TheaterComedyIcon;
  return PlaceIcon;
}

const EVENT_COLORS = {
  local: { bg: "#1B5E20", label: "Local" },
  google: { bg: "#C6993A", label: "Google" },
  friend: { bg: "#333333", label: "Friend" },
};

function NearbyPlaces({ location }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        // Use the location string as the city/area for nearby search
        const results = await serverAPI.fetchNearbyPlaces(location, "restaurants");
        if (!cancelled) {
          setPlaces(results.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching nearby places:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPlaces();
    return () => { cancelled = true; };
  }, [location]);

  if (loading) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 1, display: "block" }}>
          Nearby
        </Typography>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={44} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (places.length === 0) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.65rem",
          display: "block",
          mb: 1,
        }}
      >
        Nearby
      </Typography>
      {places.map((place) => (
        <Card
          key={`${place.source}-${place.id}`}
          component="a"
          href={place.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1,
            textDecoration: "none",
            color: "inherit",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "none",
            transition: "background 0.15s",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            {(() => {
              const IconComp = getCategoryIcon(place.category);
              return <IconComp sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />;
            })()}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {place.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {place.rating && (
                  <>
                    <StarIcon sx={{ fontSize: 12, color: tokens.colors.accent }} />
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                      {place.rating.toFixed(1)}
                    </Typography>
                  </>
                )}
                {place.category && (
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", ml: 0.5 }}>
                    {place.category}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

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
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <NotesIcon sx={{ color: "text.secondary", fontSize: 20, mt: 0.25 }} />
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            {event.description}
          </Typography>
        </Box>
      )}

      {/* Nearby places when event has a location */}
      {event.location && (
        <>
          <Divider sx={{ mb: 2 }} />
          <NearbyPlaces location={event.location} />
        </>
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
