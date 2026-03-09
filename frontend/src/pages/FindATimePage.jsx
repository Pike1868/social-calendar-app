import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  Drawer,
  Divider,
  IconButton,
  TextField,
  Autocomplete,
  Fade,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFriends,
  fetchCircles,
  selectFriends,
  selectCircles,
  selectFriendsLoading,
} from "../redux/friendSlice";
import {
  fetchFreeBusy,
  clearFreeBusy,
  selectFreeBusyAvailability,
  selectFreeBusyLoading,
  selectFreeBusyError,
  clearFreeBusyError,
} from "../redux/freeBusySlice";
import { createEvent } from "../redux/eventSlice";
import { createGoogleEvent } from "../redux/googleEventSlice";
import { selectUser } from "../redux/userSlice";
import { tokens } from "../theme";

dayjs.extend(isBetween);

// ── Helpers ──

function getInitials(friend) {
  if (friend.first_name && friend.last_name)
    return `${friend.first_name[0]}${friend.last_name[0]}`.toUpperCase();
  if (friend.display_name) return friend.display_name[0].toUpperCase();
  return "?";
}

function getDisplayName(friend) {
  if (friend.display_name) return friend.display_name;
  if (friend.first_name && friend.last_name)
    return `${friend.first_name} ${friend.last_name}`;
  return friend.email || "Unknown";
}

/** Build array of 7 dayjs objects starting from Monday of the given week. */
function getWeekDays(referenceDate) {
  const start = dayjs(referenceDate).startOf("week"); // Sunday
  const monday = start.add(1, "day"); // shift to Monday
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
}

/** Hours displayed on the grid (8 AM – 9 PM) */
const HOUR_START = 8;
const HOUR_END = 21;
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START },
  (_, i) => HOUR_START + i
);
const HOUR_HEIGHT = 60; // px per hour

/** Assign consistent colors to friends */
const FRIEND_COLORS = [
  "#E53935",
  "#8E24AA",
  "#1E88E5",
  "#FB8C00",
  "#43A047",
  "#00ACC1",
  "#F4511E",
  "#6D4C41",
];

/**
 * Compute busy blocks positioned on the grid.
 * Returns array of { top, height, dayIndex } for a given day.
 */
function getBusyBlocksForDay(busyPeriods, day) {
  if (!busyPeriods || !busyPeriods.length) return [];

  const dayStart = day.hour(HOUR_START).minute(0).second(0);
  const dayEnd = day.hour(HOUR_END).minute(0).second(0);

  return busyPeriods
    .map(({ start, end }) => {
      const bStart = dayjs(start);
      const bEnd = dayjs(end);

      // Skip if block is entirely outside this day's visible range
      if (bEnd.isBefore(dayStart) || bStart.isAfter(dayEnd)) return null;

      const clampedStart = bStart.isBefore(dayStart) ? dayStart : bStart;
      const clampedEnd = bEnd.isAfter(dayEnd) ? dayEnd : bEnd;

      const topMinutes = clampedStart.diff(dayStart, "minute");
      const heightMinutes = clampedEnd.diff(clampedStart, "minute");

      return {
        top: (topMinutes / 60) * HOUR_HEIGHT,
        height: Math.max((heightMinutes / 60) * HOUR_HEIGHT, 4),
      };
    })
    .filter(Boolean);
}

/**
 * Find mutual free windows for a given day across all selected friends.
 * Returns array of { start: dayjs, end: dayjs, top, height }.
 */
function getMutualFreeWindows(availability, selectedFriendIds, day) {
  const dayStart = day.hour(HOUR_START).minute(0).second(0);
  const dayEnd = day.hour(HOUR_END).minute(0).second(0);

  // Collect all busy intervals for this day from all friends
  const allBusy = [];
  for (const friendId of selectedFriendIds) {
    const data = availability[friendId];
    if (!data || data.error || !data.busy) continue;
    for (const { start, end } of data.busy) {
      const bStart = dayjs(start);
      const bEnd = dayjs(end);
      if (bEnd.isBefore(dayStart) || bStart.isAfter(dayEnd)) continue;
      allBusy.push({
        start: bStart.isBefore(dayStart) ? dayStart : bStart,
        end: bEnd.isAfter(dayEnd) ? dayEnd : bEnd,
      });
    }
  }

  // Sort by start time
  allBusy.sort((a, b) => a.start.diff(b.start));

  // Merge overlapping busy intervals
  const merged = [];
  for (const interval of allBusy) {
    if (
      merged.length &&
      interval.start.isBefore(merged[merged.length - 1].end)
    ) {
      const last = merged[merged.length - 1];
      if (interval.end.isAfter(last.end)) {
        last.end = interval.end;
      }
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }

  // Find free windows (gaps between merged busy blocks)
  const freeWindows = [];
  let cursor = dayStart;

  for (const busy of merged) {
    if (busy.start.isAfter(cursor)) {
      const gapMinutes = busy.start.diff(cursor, "minute");
      if (gapMinutes >= 30) {
        // Only show windows >= 30 min
        const topMinutes = cursor.diff(dayStart, "minute");
        freeWindows.push({
          start: cursor,
          end: busy.start,
          top: (topMinutes / 60) * HOUR_HEIGHT,
          height: (gapMinutes / 60) * HOUR_HEIGHT,
        });
      }
    }
    cursor = busy.end.isAfter(cursor) ? busy.end : cursor;
  }

  // Trailing free window after last busy block
  if (cursor.isBefore(dayEnd)) {
    const gapMinutes = dayEnd.diff(cursor, "minute");
    if (gapMinutes >= 30) {
      const topMinutes = cursor.diff(dayStart, "minute");
      freeWindows.push({
        start: cursor,
        end: dayEnd,
        top: (topMinutes / 60) * HOUR_HEIGHT,
        height: (gapMinutes / 60) * HOUR_HEIGHT,
      });
    }
  }

  return freeWindows;
}

// ── Main Component ──

export default function FindATimePage() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const rawFriends = useSelector(selectFriends);
  const friends = useMemo(() => rawFriends || [], [rawFriends]);
  const circles = useSelector(selectCircles) || [];
  const friendsLoading = useSelector(selectFriendsLoading);
  const availability = useSelector(selectFreeBusyAvailability);
  const freeBusyLoading = useSelector(selectFreeBusyLoading);
  const freeBusyError = useSelector(selectFreeBusyError);
  const { userDetails } = useSelector(selectUser);

  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [weekStart, setWeekStart] = useState(dayjs());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventData, setEventData] = useState({
    title: "",
    start_time: null,
    end_time: null,
    location: "",
    description: "",
  });

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Load friends/circles on mount
  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchCircles());
  }, [dispatch]);

  // Fetch FreeBusy when friends selected or week changes
  useEffect(() => {
    if (selectedFriendIds.length === 0) {
      dispatch(clearFreeBusy());
      return;
    }

    const timeMin = weekDays[0].hour(HOUR_START).toISOString();
    const timeMax = weekDays[6].hour(HOUR_END).toISOString();

    dispatch(fetchFreeBusy({ friendIds: selectedFriendIds, timeMin, timeMax }));
  }, [selectedFriendIds, weekDays, dispatch]);

  // ── Friend picker logic ──

  const friendOptions = useMemo(() => {
    return friends.map((f) => ({
      id: f.id || f.user_id,
      label: getDisplayName(f),
      friend: f,
    }));
  }, [friends]);

  const handleRemoveFriend = useCallback((friendId) => {
    setSelectedFriendIds((prev) => prev.filter((id) => id !== friendId));
  }, []);

  const handleAddCircle = useCallback(
    (circle) => {
      const memberIds = circle.members.map((m) => m.user_id);
      setSelectedFriendIds((prev) => {
        const combined = new Set([...prev, ...memberIds]);
        return Array.from(combined);
      });
    },
    []
  );

  // ── Week navigation ──

  const goToPrevWeek = () => setWeekStart((d) => d.subtract(7, "day"));
  const goToNextWeek = () => setWeekStart((d) => d.add(7, "day"));
  const goToThisWeek = () => setWeekStart(dayjs());

  // ── Event creation from free window ──

  const handleFreeWindowClick = (freeWindow) => {
    setEventData({
      title: "",
      start_time: freeWindow.start,
      end_time: freeWindow.end.diff(freeWindow.start, "hour") > 2
        ? freeWindow.start.add(1, "hour")
        : freeWindow.end,
      location: "",
      description: "",
    });
    setEventModalOpen(true);
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (!eventData.title.trim() || !eventData.start_time || !eventData.end_time)
      return;

    const submissionData = {
      ...eventData,
      start_time: dayjs(eventData.start_time).format(),
      end_time: dayjs(eventData.end_time).format(),
    };

    const action =
      userDetails?.access_token ? createGoogleEvent : createEvent;
    dispatch(action(submissionData));
    setEventModalOpen(false);
  };

  // ── Friend color map ──

  const friendColorMap = useMemo(() => {
    const map = {};
    selectedFriendIds.forEach((id, idx) => {
      map[id] = FRIEND_COLORS[idx % FRIEND_COLORS.length];
    });
    return map;
  }, [selectedFriendIds]);

  // ── Render ──

  return (
    <Fade in timeout={400}>
      <Box>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SearchIcon
              sx={{ color: "primary.main", fontSize: 28 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Find a Time
            </Typography>
          </Box>

          {/* Privacy indicator */}
          <Chip
            icon={<LockOutlinedIcon sx={{ fontSize: 16 }} />}
            label="Only free/busy times are shared"
            size="small"
            variant="outlined"
            sx={{
              borderColor: "divider",
              color: "text.secondary",
              fontSize: "0.75rem",
            }}
          />
        </Box>

        {/* Friend / Circle Picker */}
        <Card
          sx={{
            mb: 3,
            boxShadow: theme.shadows[1],
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 600, color: "text.secondary" }}
            >
              Who are you meeting with?
            </Typography>

            {friendsLoading ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Skeleton width={200} height={40} />
                <Skeleton width={100} height={40} />
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Friend autocomplete */}
                <Autocomplete
                  multiple
                  options={friendOptions.filter(
                    (o) => !selectedFriendIds.includes(o.id)
                  )}
                  getOptionLabel={(o) => o.label}
                  value={friendOptions.filter((o) =>
                    selectedFriendIds.includes(o.id)
                  )}
                  onChange={(_, newVal) =>
                    setSelectedFriendIds(newVal.map((v) => v.id))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search friends..."
                      size="small"
                    />
                  )}
                  renderTags={() => null} // We render chips below
                  size="small"
                />

                {/* Selected friends as chips */}
                {selectedFriendIds.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedFriendIds.map((id) => {
                      const friend = friends.find(
                        (f) => (f.id || f.user_id) === id
                      );
                      if (!friend) return null;
                      return (
                        <Chip
                          key={id}
                          avatar={
                            <Avatar
                              sx={{
                                bgcolor: friendColorMap[id],
                                width: 24,
                                height: 24,
                                fontSize: "0.7rem",
                              }}
                            >
                              {getInitials(friend)}
                            </Avatar>
                          }
                          label={getDisplayName(friend)}
                          onDelete={() => handleRemoveFriend(id)}
                          size="small"
                          sx={{
                            borderLeft: `3px solid ${friendColorMap[id]}`,
                          }}
                        />
                      );
                    })}
                  </Box>
                )}

                {/* Circle quick-add buttons */}
                {circles.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", alignSelf: "center", mr: 0.5 }}
                    >
                      Circles:
                    </Typography>
                    {circles.map((circle) => (
                      <Chip
                        key={circle.id}
                        icon={<GroupsOutlinedIcon sx={{ fontSize: 16 }} />}
                        label={circle.name}
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddCircle(circle)}
                        sx={{ cursor: "pointer" }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Week navigation */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={goToPrevWeek} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {weekDays[0].format("MMM D")} – {weekDays[6].format("MMM D, YYYY")}
            </Typography>
            <IconButton onClick={goToNextWeek} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Button size="small" onClick={goToThisWeek} variant="outlined">
            Today
          </Button>
        </Box>

        {/* Week Grid */}
        {selectedFriendIds.length === 0 ? (
          <Card
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: "center",
              boxShadow: theme.shadows[1],
            }}
          >
            <GroupsOutlinedIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Select friends to compare availability
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Choose friends or a circle above to see when everyone is free.
            </Typography>
          </Card>
        ) : freeBusyLoading ? (
          <Card sx={{ p: 4, textAlign: "center", boxShadow: theme.shadows[1] }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading availability...
            </Typography>
          </Card>
        ) : (
          <Card
            sx={{
              boxShadow: theme.shadows[1],
              overflow: "auto",
            }}
          >
            {/* Legend */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                alignItems: "center",
              }}
            >
              {selectedFriendIds.map((id) => {
                const friend = friends.find((f) => (f.id || f.user_id) === id);
                const data = availability[id];
                if (!friend) return null;
                return (
                  <Box
                    key={id}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: friendColorMap[id],
                        opacity: 0.7,
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {getDisplayName(friend)}
                    </Typography>
                    {data?.error && (
                      <Typography
                        variant="caption"
                        sx={{ color: "error.main", ml: 0.5 }}
                      >
                        (unavailable)
                      </Typography>
                    )}
                  </Box>
                );
              })}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 1,
                    bgcolor: tokens.colors.success,
                    opacity: 0.25,
                    border: `1px solid ${tokens.colors.success}`,
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  Everyone free
                </Typography>
              </Box>
            </Box>

            {/* Grid */}
            <Box
              sx={{
                display: "flex",
                minWidth: isMobile ? 700 : "auto",
              }}
            >
              {/* Time labels column */}
              <Box
                sx={{
                  width: 56,
                  flexShrink: 0,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  pt: "40px", // align with day headers
                }}
              >
                {HOURS.map((hour) => (
                  <Box
                    key={hour}
                    sx={{
                      height: HOUR_HEIGHT,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "flex-end",
                      pr: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.65rem",
                        mt: "-6px",
                      }}
                    >
                      {hour > 12
                        ? `${hour - 12} PM`
                        : hour === 12
                        ? "12 PM"
                        : `${hour} AM`}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Day columns */}
              {weekDays.map((day, dayIndex) => {
                const isToday = day.isSame(dayjs(), "day");
                const freeWindows = getMutualFreeWindows(
                  availability,
                  selectedFriendIds,
                  day
                );

                return (
                  <Box
                    key={dayIndex}
                    sx={{
                      flex: 1,
                      minWidth: isMobile ? 90 : 0,
                      borderRight:
                        dayIndex < 6
                          ? `1px solid ${theme.palette.divider}`
                          : "none",
                    }}
                  >
                    {/* Day header */}
                    <Box
                      sx={{
                        height: 40,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        bgcolor: isToday
                          ? "rgba(27, 94, 32, 0.06)"
                          : "transparent",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.65rem",
                          color: isToday
                            ? "primary.main"
                            : "text.secondary",
                          fontWeight: isToday ? 600 : 400,
                          textTransform: "uppercase",
                        }}
                      >
                        {day.format("ddd")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isToday
                            ? "primary.main"
                            : "text.primary",
                          lineHeight: 1,
                        }}
                      >
                        {day.format("D")}
                      </Typography>
                    </Box>

                    {/* Time grid body */}
                    <Box
                      sx={{
                        position: "relative",
                        height: HOURS.length * HOUR_HEIGHT,
                      }}
                    >
                      {/* Hour lines */}
                      {HOURS.map((hour, i) => (
                        <Box
                          key={hour}
                          sx={{
                            position: "absolute",
                            top: i * HOUR_HEIGHT,
                            left: 0,
                            right: 0,
                            height: HOUR_HEIGHT,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            opacity: 0.5,
                          }}
                        />
                      ))}

                      {/* Mutual free windows (green) — clickable */}
                      {freeWindows.map((fw, i) => (
                        <Box
                          key={`free-${i}`}
                          onClick={() => handleFreeWindowClick(fw)}
                          sx={{
                            position: "absolute",
                            top: fw.top,
                            left: 2,
                            right: 2,
                            height: fw.height,
                            bgcolor: "rgba(46, 125, 50, 0.15)",
                            border: `1px solid rgba(46, 125, 50, 0.4)`,
                            borderRadius: 1,
                            cursor: "pointer",
                            zIndex: 2,
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            "&:hover": {
                              bgcolor: "rgba(46, 125, 50, 0.28)",
                              border: `1px solid rgba(46, 125, 50, 0.7)`,
                              boxShadow: theme.shadows[2],
                            },
                          }}
                        >
                          {fw.height > 30 && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: tokens.colors.success,
                                fontWeight: 600,
                                fontSize: "0.6rem",
                                textAlign: "center",
                                px: 0.5,
                                lineHeight: 1.2,
                              }}
                            >
                              {fw.start.format("h:mm")}–{fw.end.format("h:mm a")}
                            </Typography>
                          )}
                        </Box>
                      ))}

                      {/* Busy blocks per friend */}
                      {selectedFriendIds.map((friendId, friendIdx) => {
                        const data = availability[friendId];
                        if (!data || data.error || !data.busy) return null;

                        const blocks = getBusyBlocksForDay(data.busy, day);
                        const totalFriends = selectedFriendIds.length;
                        const laneWidth =
                          totalFriends > 1
                            ? `calc((100% - 8px) / ${totalFriends})`
                            : "calc(100% - 8px)";
                        const laneLeft =
                          totalFriends > 1
                            ? `calc(4px + (100% - 8px) / ${totalFriends} * ${friendIdx})`
                            : "4px";

                        return blocks.map((block, blockIdx) => (
                          <Box
                            key={`busy-${friendId}-${blockIdx}`}
                            sx={{
                              position: "absolute",
                              top: block.top,
                              left: laneLeft,
                              width: laneWidth,
                              height: block.height,
                              bgcolor: friendColorMap[friendId],
                              opacity: 0.35,
                              borderRadius: 0.5,
                              zIndex: 1,
                              pointerEvents: "none",
                            }}
                          />
                        ));
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>
        )}

        {/* Error snackbar */}
        <Snackbar
          open={!!freeBusyError}
          autoHideDuration={6000}
          onClose={() => dispatch(clearFreeBusyError())}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => dispatch(clearFreeBusyError())}
          >
            {Array.isArray(freeBusyError)
              ? freeBusyError.join(", ")
              : freeBusyError || "Failed to load availability"}
          </Alert>
        </Snackbar>

        {/* Event Creator Modal */}
        <EventCreatorFromFreeWindow
          open={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          eventData={eventData}
          setEventData={setEventData}
          onSubmit={handleEventSubmit}
          selectedFriends={selectedFriendIds
            .map((id) => friends.find((f) => (f.id || f.user_id) === id))
            .filter(Boolean)}
          isMobile={isMobile}
          theme={theme}
        />
      </Box>
    </Fade>
  );
}

// ── Event Creator Sub-component ──

function EventCreatorFromFreeWindow({
  open,
  onClose,
  eventData,
  setEventData,
  onSubmit,
  selectedFriends,
  isMobile,
  theme,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const formContent = (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        p: isMobile ? 2 : 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EventIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create Hangout
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Invitees display */}
      {selectedFriends.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(27, 94, 32, 0.06)",
            border: `1px solid`,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", mr: 0.5 }}>
            With:
          </Typography>
          {selectedFriends.map((friend) => (
            <Chip
              key={friend.id || friend.user_id}
              avatar={
                <Avatar sx={{ width: 20, height: 20, fontSize: "0.6rem" }}>
                  {getInitials(friend)}
                </Avatar>
              }
              label={getDisplayName(friend)}
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Title */}
      <TextField
        name="title"
        label="What's the plan?"
        value={eventData.title}
        onChange={handleChange}
        fullWidth
        required
        autoFocus
        placeholder="Coffee, dinner, movie night..."
      />

      {/* Date/Time Pickers */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <DateTimePicker
          label="Start Time"
          value={eventData.start_time}
          onChange={(val) => handleDateChange("start_time", val)}
          slotProps={{
            textField: { fullWidth: true, size: "small" },
          }}
        />
        <DateTimePicker
          label="End Time"
          value={eventData.end_time}
          onChange={(val) => handleDateChange("end_time", val)}
          minDateTime={eventData.start_time || undefined}
          slotProps={{
            textField: { fullWidth: true, size: "small" },
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
        size="small"
        placeholder="Add a location"
        InputProps={{
          startAdornment: (
            <LocationOnIcon
              sx={{ color: "text.secondary", mr: 1, fontSize: 20 }}
            />
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
        rows={2}
        size="small"
        placeholder="Add details..."
        InputProps={{
          startAdornment: (
            <NotesIcon
              sx={{
                color: "text.secondary",
                mr: 1,
                fontSize: 20,
                alignSelf: "flex-start",
                mt: 1,
              }}
            />
          ),
        }}
      />

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        startIcon={<AddIcon />}
        disabled={!eventData.title.trim()}
        sx={{ mt: 1, py: 1.5, fontWeight: 600 }}
      >
        Create Hangout
      </Button>
    </Box>
  );

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
            maxHeight: "90vh",
          },
        }}
      >
        <Box
          sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0 }}
        >
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
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
  );
}
