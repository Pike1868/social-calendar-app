import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useSelector, useDispatch } from "react-redux";
import { selectEvents, selectShowLocalEvents, setCurrentEvent, resetCurrentEvent } from "../../redux/eventSlice";
import { selectVisibleGoogleEvents, selectShowGoogleEvents, setCurrentGoogleEvent, resetCurrentGoogleEvent } from "../../redux/googleEventSlice";
import EventDetailModal from "./EventDetailModal";
import EventManagerModal from "../EventManagerModal";
import MobileDayDrawer from "./MobileDayDrawer";
import dayjs from "dayjs";

// Event source colors matching design tokens
const EVENT_COLORS = {
  local: { bg: "#1B5E20", border: "#0D3B13", text: "#FFFFFF" },
  google: { bg: "#C6993A", border: "#A67C2E", text: "#000000" },
  friend: { bg: "#333333", border: "#222222", text: "#FFFFFF" },
};

export default function CalendarView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const calendarRef = useRef(null);

  const [currentView, setCurrentView] = useState(isMobile ? "dayGridMonth" : "dayGridMonth");
  const [title, setTitle] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [dayDrawerDate, setDayDrawerDate] = useState(null);
  const [dayDrawerEvents, setDayDrawerEvents] = useState([]);

  // Touch tracking for swipe
  const touchStartX = useRef(null);

  // Redux selectors
  const localEvents = useSelector(selectEvents);
  const googleEvents = useSelector(selectVisibleGoogleEvents);
  const showLocal = useSelector(selectShowLocalEvents);
  const showGoogle = useSelector(selectShowGoogleEvents);

  // Transform events into FullCalendar format
  const calendarEvents = useMemo(() => {
    const events = [];

    if (showLocal) {
      localEvents.forEach((event) => {
        // Skip events that have a google_id when Google events are shown (avoid duplicates)
        if (showGoogle && event.google_id) return;
        events.push({
          id: `local-${event.id}`,
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          backgroundColor: EVENT_COLORS.local.bg,
          borderColor: EVENT_COLORS.local.border,
          textColor: EVENT_COLORS.local.text,
          extendedProps: {
            source: "local",
            originalId: event.id,
            location: event.location,
            description: event.description,
          },
        });
      });
    }

    if (showGoogle) {
      googleEvents.forEach((event) => {
        events.push({
          id: `google-${event.id}`,
          title: event.title,
          start: event.start_time,
          end: event.end_time,
          backgroundColor: EVENT_COLORS.google.bg,
          borderColor: EVENT_COLORS.google.border,
          textColor: EVENT_COLORS.google.text,
          extendedProps: {
            source: "google",
            originalId: event.id,
            location: event.location,
            description: event.description,
          },
        });
      });
    }

    return events;
  }, [localEvents, googleEvents, showLocal, showGoogle]);

  // Handle event click → open detail modal
  const handleEventClick = useCallback((clickInfo) => {
    const { source, originalId, location, description } = clickInfo.event.extendedProps;

    setSelectedEvent({
      id: originalId,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      source,
      location: location || "",
      description: description || "",
    });

    // Set Redux state for EventManagerModal compatibility
    if (source === "local") {
      dispatch(resetCurrentGoogleEvent());
      dispatch(setCurrentEvent({ id: originalId, source: "local" }));
    } else {
      dispatch(resetCurrentEvent());
      dispatch(setCurrentGoogleEvent({ id: originalId, source: "google" }));
    }

    setDetailOpen(true);
  }, [dispatch]);

  // Handle date click on mobile → open day drawer
  const handleDateClick = useCallback((dateInfo) => {
    if (!isMobile) return;

    const clickedDate = dayjs(dateInfo.date);
    const eventsForDay = calendarEvents.filter((event) => {
      return dayjs(event.start).isSame(clickedDate, "day") ||
        dayjs(event.end).isSame(clickedDate, "day");
    });

    setDayDrawerDate(clickedDate);
    setDayDrawerEvents(eventsForDay);
    setDayDrawerOpen(true);
  }, [isMobile, calendarEvents]);

  // Close detail modal
  const handleDetailClose = useCallback(() => {
    setDetailOpen(false);
    setSelectedEvent(null);
    dispatch(resetCurrentEvent());
    dispatch(resetCurrentGoogleEvent());
  }, [dispatch]);

  // Open edit modal from detail view
  const handleEditEvent = useCallback(() => {
    setDetailOpen(false);
    setEditModalOpen(true);
  }, []);

  // Close edit modal
  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // View change handler
  const handleViewChange = useCallback((_event, newView) => {
    if (newView && calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(newView);
      setCurrentView(newView);
    }
  }, []);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.prev();
      setTitle(api.view.title);
    }
  }, []);

  const handleNext = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.next();
      setTitle(api.view.title);
    }
  }, []);

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.today();
      setTitle(api.view.title);
    }
  }, []);

  // Update title on dates change
  const handleDatesSet = useCallback((dateInfo) => {
    setTitle(dateInfo.view.title);
  }, []);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartX.current = null;
  }, [handlePrev, handleNext]);

  // Event content renderer for mobile dots
  const renderEventContent = useCallback((eventInfo) => {
    if (isMobile && currentView === "dayGridMonth") {
      // Render as a small dot
      return (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: eventInfo.event.backgroundColor,
            mx: "1px",
            display: "inline-block",
          }}
        />
      );
    }

    // Desktop/week/day: render as chip-style
    return (
      <Box
        sx={{
          px: 0.5,
          py: "1px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "0.75rem",
          lineHeight: 1.3,
          width: "100%",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: eventInfo.event.textColor,
            fontSize: "inherit",
            lineHeight: "inherit",
          }}
        >
          {eventInfo.event.title}
        </Typography>
      </Box>
    );
  }, [isMobile, currentView]);

  // Sync view when breakpoint changes
  useEffect(() => {
    if (isMobile && (currentView === "timeGridWeek" || currentView === "timeGridDay")) {
      // Keep current view on mobile, but default new sessions to month
    }
  }, [isMobile, currentView]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar: title, navigation, view toggle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {/* Left: nav arrows + title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton onClick={handlePrev} size="small" aria-label="Previous">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={handleNext} size="small" aria-label="Next">
            <ChevronRightIcon />
          </IconButton>
          <IconButton onClick={handleToday} size="small" aria-label="Today" sx={{ mr: 1 }}>
            <TodayIcon fontSize="small" />
          </IconButton>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {title}
          </Typography>
        </Box>

        {/* Right: view toggle */}
        <ToggleButtonGroup
          value={currentView}
          exclusive
          onChange={handleViewChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              px: isMobile ? 1.5 : 2,
              py: 0.5,
              fontSize: "0.8rem",
              borderColor: theme.palette.divider,
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                "&:hover": {
                  backgroundColor: theme.palette.primary.light,
                },
              },
            },
          }}
        >
          <ToggleButton value="dayGridMonth">Month</ToggleButton>
          <ToggleButton value="timeGridWeek">Week</ToggleButton>
          <ToggleButton value="timeGridDay">Day</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
        {showLocal && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: EVENT_COLORS.local.bg }} />
            <Typography variant="caption" color="text.secondary">Local</Typography>
          </Box>
        )}
        {showGoogle && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: EVENT_COLORS.google.bg }} />
            <Typography variant="caption" color="text.secondary">Google</Typography>
          </Box>
        )}
      </Box>

      {/* FullCalendar */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          flex: 1,
          "& .fc": {
            fontFamily: theme.typography.fontFamily,
            height: "100%",
          },
          // Header hidden (we use our own toolbar)
          "& .fc .fc-header-toolbar": {
            display: "none",
          },
          // Day header styling
          "& .fc .fc-col-header-cell": {
            backgroundColor: theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : theme.palette.grey[50],
            borderColor: theme.palette.divider,
            py: 1,
          },
          "& .fc .fc-col-header-cell-cushion": {
            color: theme.palette.text.secondary,
            fontWeight: 500,
            fontSize: "0.8rem",
            textDecoration: "none",
          },
          // Day cell styling
          "& .fc .fc-daygrid-day": {
            borderColor: theme.palette.divider,
            cursor: isMobile ? "pointer" : "default",
          },
          "& .fc .fc-daygrid-day-number": {
            color: theme.palette.text.primary,
            textDecoration: "none",
            fontSize: "0.85rem",
            padding: "4px 8px",
          },
          "& .fc .fc-daygrid-day.fc-day-today": {
            backgroundColor: theme.palette.mode === "dark"
              ? "rgba(27, 94, 32, 0.12)"
              : "rgba(27, 94, 32, 0.06)",
          },
          "& .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number": {
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            borderRadius: "50%",
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          // Event styling
          "& .fc .fc-daygrid-event": {
            borderRadius: "4px",
            border: "none",
            marginBottom: "1px",
            ...(isMobile && currentView === "dayGridMonth" ? {
              // Dot mode on mobile month
              backgroundColor: "transparent !important",
              border: "none !important",
              boxShadow: "none",
              margin: 0,
              padding: 0,
            } : {}),
          },
          "& .fc .fc-timegrid-event": {
            borderRadius: "4px",
            border: "none",
          },
          // Mobile month: center the dots
          ...(isMobile && currentView === "dayGridMonth" ? {
            "& .fc .fc-daygrid-day-events": {
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              minHeight: "10px !important",
              gap: "1px",
            },
            "& .fc .fc-daygrid-event-harness": {
              margin: 0,
            },
            "& .fc .fc-daygrid-day-frame": {
              minHeight: isMobile ? "60px" : "100px",
            },
          } : {
            "& .fc .fc-daygrid-day-frame": {
              minHeight: "100px",
            },
          }),
          // Other day (different month) styling
          "& .fc .fc-day-other .fc-daygrid-day-number": {
            color: theme.palette.text.secondary,
            opacity: 0.5,
          },
          // Time grid
          "& .fc .fc-timegrid-slot": {
            borderColor: theme.palette.divider,
            height: "48px",
          },
          "& .fc .fc-timegrid-axis-cushion": {
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
          },
          // Scrollbar
          "& .fc .fc-scroller": {
            overflow: "auto !important",
          },
          // Table borders
          "& .fc td, & .fc th": {
            borderColor: theme.palette.divider,
          },
          "& .fc .fc-scrollgrid": {
            borderColor: theme.palette.divider,
          },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          eventContent={renderEventContent}
          headerToolbar={false}
          height="auto"
          dayMaxEvents={isMobile && currentView === "dayGridMonth" ? false : 3}
          fixedWeekCount={false}
          nowIndicator={true}
          editable={false}
          selectable={false}
          firstDay={0}
        />
      </Box>

      {/* Event Detail Modal */}
      <EventDetailModal
        open={detailOpen}
        event={selectedEvent}
        onClose={handleDetailClose}
        onEdit={handleEditEvent}
      />

      {/* Event Manager Modal (Edit/Delete) */}
      <EventManagerModal
        isModalOpen={editModalOpen}
        toggleModal={handleEditModalClose}
      />

      {/* Mobile Day Drawer */}
      <MobileDayDrawer
        open={dayDrawerOpen}
        date={dayDrawerDate}
        events={dayDrawerEvents}
        onClose={() => setDayDrawerOpen(false)}
        onEventClick={(event) => {
          setDayDrawerOpen(false);
          setSelectedEvent({
            id: event.extendedProps.originalId,
            title: event.title,
            start: event.start,
            end: event.end,
            source: event.extendedProps.source,
            location: event.extendedProps.location || "",
            description: event.extendedProps.description || "",
          });
          if (event.extendedProps.source === "local") {
            dispatch(resetCurrentGoogleEvent());
            dispatch(setCurrentEvent({ id: event.extendedProps.originalId, source: "local" }));
          } else {
            dispatch(resetCurrentEvent());
            dispatch(setCurrentGoogleEvent({ id: event.extendedProps.originalId, source: "google" }));
          }
          setDetailOpen(true);
        }}
      />
    </Box>
  );
}
