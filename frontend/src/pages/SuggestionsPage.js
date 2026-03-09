import React, { useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Fade,
  Skeleton,
} from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSuggestions,
  dismissSuggestion,
  actOnSuggestion,
  generateSuggestions,
  clearSuggestionError,
  selectSuggestions,
  selectSuggestionsLoading,
  selectSuggestionError,
} from "../redux/suggestionSlice";
import { tokens } from "../theme";
import { useNavigate } from "react-router-dom";

// ── Map suggestion type to icon ──
const typeIconMap = {
  availability: EventAvailableOutlinedIcon,
  proximity: LocationOnOutlinedIcon,
  event: CalendarTodayOutlinedIcon,
  reconnect: PeopleOutlineIcon,
};

// ── Map suggestion type to CTA label ──
const typeCtaMap = {
  availability: "Find a Time",
  proximity: "See Friends",
  event: "View Event",
  reconnect: "See Friends",
};

// ── Map suggestion type to navigation route ──
const typeRouteMap = {
  availability: "/find-a-time",
  proximity: "/friends",
  event: "/home",
  reconnect: "/friends",
};

// ── Card style matching FriendsPage ──
const cardSx = {
  borderRadius: 3,
  boxShadow: tokens.shadows.subtle,
  border: "1px solid",
  borderColor: "divider",
  overflow: "visible",
  transition: "box-shadow 0.2s, transform 0.2s",
  "&:hover": {
    boxShadow: tokens.shadows.medium,
  },
};

// ── Skeleton Cards ──
function SuggestionSkeletons() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {[1, 2, 3].map((i) => (
        <Card key={i} sx={cardSx}>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="90%" height={18} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="40%" height={18} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 2 }}>
              <Skeleton variant="rounded" width={100} height={36} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ── Empty State ──
function EmptyState({ onGenerate, loading }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 10,
        px: 4,
      }}
    >
      <LightbulbOutlinedIcon
        sx={{ fontSize: 64, color: "secondary.main", opacity: 0.5, mb: 3 }}
      />
      <Typography variant="h6" sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}>
        No suggestions yet
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 4, maxWidth: 360, mx: "auto" }}
      >
        We'll analyze your calendar, friends, and availability to suggest ways to connect.
        Tap below to get started.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={onGenerate}
        disabled={loading}
        startIcon={<AutoAwesomeOutlinedIcon />}
        sx={{ fontWeight: 600, px: 5 }}
      >
        Generate Suggestions
      </Button>
    </Box>
  );
}

// ── Suggestion Card ──
function SuggestionCard({ suggestion, onDismiss, onAct }) {
  const navigate = useNavigate();
  const type = suggestion.type || "reconnect";
  const Icon = typeIconMap[type] || PeopleOutlineIcon;
  const ctaLabel = typeCtaMap[type] || "View";
  const route = typeRouteMap[type] || "/home";

  const handleAction = async () => {
    await onAct(suggestion.id);
    navigate(route);
  };

  return (
    <Card sx={cardSx}>
      <CardContent
        sx={{
          p: { xs: 3, sm: 4 },
          pb: { xs: 1, sm: 1 },
          "&:last-child": { pb: { xs: 1, sm: 1 } },
        }}
      >
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* Type Icon */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "secondary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 22, color: tokens.colors.white }} />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                {suggestion.title}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onDismiss(suggestion.id)}
                sx={{
                  color: "text.secondary",
                  flexShrink: 0,
                  mt: -0.5,
                  "&:hover": { color: "error.main" },
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, lineHeight: 1.5 }}
            >
              {suggestion.body}
            </Typography>
            {suggestion.type && (
              <Chip
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                size="small"
                sx={{
                  mt: 1.5,
                  height: 22,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  bgcolor: `${tokens.colors.accent}18`,
                  color: "secondary.dark",
                  border: "none",
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 2, sm: 3 }, pt: 1, justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleAction}
          sx={{
            fontWeight: 600,
            px: 3,
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.light" },
          }}
        >
          {ctaLabel}
        </Button>
      </CardActions>
    </Card>
  );
}

// ── Main Page ──
export default function SuggestionsPage() {
  const dispatch = useDispatch();
  const suggestions = useSelector(selectSuggestions);
  const loading = useSelector(selectSuggestionsLoading);
  const error = useSelector(selectSuggestionError);

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Load suggestions on mount
  useEffect(() => {
    dispatch(fetchSuggestions());
  }, [dispatch]);

  // Show errors in snackbar
  useEffect(() => {
    if (error) {
      const msg = Array.isArray(error) ? error[0] : error;
      showSnack(msg, "error");
      dispatch(clearSuggestionError());
    }
  }, [error, dispatch, showSnack]);

  const handleDismiss = async (id) => {
    try {
      await dispatch(dismissSuggestion(id)).unwrap();
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleAct = async (id) => {
    try {
      await dispatch(actOnSuggestion(id)).unwrap();
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleGenerate = async () => {
    try {
      await dispatch(generateSuggestions()).unwrap();
      showSnack("Suggestions generated!");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleRefresh = () => {
    dispatch(fetchSuggestions());
  };

  // Filter out acted suggestions from the feed
  const activeSuggestions = suggestions.filter((s) => s.status !== "acted");

  return (
    <Fade in timeout={350}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
        {/* Header */}
        <Box
          sx={{
            px: { xs: 1, sm: 2 },
            pt: 1,
            pb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Suggestions
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {activeSuggestions.length > 0 && (
              <Chip
                label={`${activeSuggestions.length} suggestion${activeSuggestions.length !== 1 ? "s" : ""}`}
                size="small"
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              sx={{ color: "text.secondary" }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            maxWidth: 640,
            mx: "auto",
            px: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {loading && activeSuggestions.length === 0 ? (
            <SuggestionSkeletons />
          ) : activeSuggestions.length === 0 ? (
            <Card sx={cardSx}>
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <EmptyState onGenerate={handleGenerate} loading={loading} />
              </CardContent>
            </Card>
          ) : (
            activeSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={handleDismiss}
                onAct={handleAct}
              />
            ))
          )}
        </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ borderRadius: 2, fontWeight: 500 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
}
