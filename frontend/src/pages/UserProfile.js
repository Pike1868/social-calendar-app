import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Fade,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import GoogleIcon from "@mui/icons-material/Google";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import serverAPI from "../api/serverAPI";
import { useSelector, useDispatch } from "react-redux";
import { selectUserDetails, setUserDetails } from "../redux/userSlice";
import { tokens } from "../theme";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

function getInitials(first, last, displayName) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (displayName) return displayName[0].toUpperCase();
  return "?";
}

export default function UserProfile() {
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef(null);

  const userTimezone =
    userDetails.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const displayBirthday = userDetails.birthday
    ? dayjs.utc(userDetails.birthday).tz(userTimezone).format("YYYY-MM-DD")
    : "";

  const [formData, setFormData] = useState({
    first_name: userDetails.first_name || "",
    last_name: userDetails.last_name || "",
    display_name: userDetails.display_name || "",
    home_city: userDetails.home_city || "",
    birthday: displayBirthday,
    time_zone: userDetails.time_zone || userTimezone,
  });

  const [avatarPreview, setAvatarPreview] = useState(
    userDetails.avatar_url || null
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [error, setError] = useState("");

  const isGoogleLinked = Boolean(userDetails.google_id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({ open: true, message: "Image must be under 2MB", severity: "error" });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const updateData = { ...formData };

      // Include avatar as base64 data URL if changed
      if (avatarFile && avatarPreview) {
        updateData.avatar_url = avatarPreview;
      }

      // Remove undefined/empty optional fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === "") {
          delete updateData[key];
        }
      });

      const updatedUser = await serverAPI.updateUser(userDetails.id, updateData);
      dispatch(setUserDetails(updatedUser));
      setSnackbar({ open: true, message: "Profile updated successfully", severity: "success" });
    } catch (err) {
      console.error("Error updating user data:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(
    formData.first_name,
    formData.last_name,
    formData.display_name
  );

  // Shared card styles
  const cardSx = {
    borderRadius: 3,
    boxShadow: tokens.shadows.subtle,
    border: "1px solid",
    borderColor: "divider",
    overflow: "visible",
  };

  const sectionTitle = (text) => (
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 600,
        color: "text.secondary",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontSize: "0.7rem",
        mb: 3,
      }}
    >
      {text}
    </Typography>
  );

  return (
    <Fade in timeout={350}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          pb: 8,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: { xs: 4, sm: 6 },
            py: 4,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <IconButton
            onClick={() => navigate("/")}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Profile
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            maxWidth: 640,
            mx: "auto",
            px: { xs: 4, sm: 6 },
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Avatar Card */}
          <Card sx={cardSx}>
            <CardContent
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                gap: 4,
                p: { xs: 4, sm: 5 },
                "&:last-child": { pb: { xs: 4, sm: 5 } },
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{
                    width: 88,
                    height: 88,
                    fontSize: "1.75rem",
                    fontWeight: 600,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    "&:hover": { opacity: 0.85 },
                  }}
                  onClick={handleAvatarClick}
                >
                  {!avatarPreview && initials}
                </Avatar>
                <IconButton
                  size="small"
                  onClick={handleAvatarClick}
                  sx={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    width: 28,
                    height: 28,
                    "&:hover": { bgcolor: "secondary.dark" },
                    boxShadow: tokens.shadows.medium,
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={handleAvatarChange}
                />
              </Box>

              <Box sx={{ textAlign: isMobile ? "center" : "left", flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formData.display_name ||
                    `${formData.first_name} ${formData.last_name}`.trim() ||
                    "Your Name"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {userDetails.email}
                </Typography>
                {formData.home_city && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, justifyContent: isMobile ? "center" : "flex-start" }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {formData.home_city}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Personal Info Card */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 4, sm: 5 }, "&:last-child": { pb: { xs: 4, sm: 5 } } }}>
              {sectionTitle("Personal Information")}

              <TextField
                fullWidth
                name="display_name"
                label="Display Name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="How you want to appear to friends"
                size="small"
                sx={{ mb: 4 }}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 4,
                  mb: 4,
                }}
              >
                <TextField
                  fullWidth
                  required
                  name="first_name"
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  size="small"
                />
                <TextField
                  fullWidth
                  required
                  name="last_name"
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  size="small"
                />
              </Box>

              <TextField
                fullWidth
                label="Email"
                value={userDetails.email || ""}
                size="small"
                disabled
                sx={{
                  mb: 4,
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "text.secondary",
                  },
                }}
              />

              <TextField
                fullWidth
                name="home_city"
                label="Home City"
                value={formData.home_city}
                onChange={handleChange}
                placeholder="Used for event suggestions near you"
                size="small"
                InputProps={{
                  startAdornment: (
                    <LocationOnOutlinedIcon
                      sx={{ mr: 2, color: "text.secondary", fontSize: 20 }}
                    />
                  ),
                }}
              />
            </CardContent>
          </Card>

          {/* Date & Time Card */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 4, sm: 5 }, "&:last-child": { pb: { xs: 4, sm: 5 } } }}>
              {sectionTitle("Date & Time")}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 4,
                }}
              >
                <TextField
                  fullWidth
                  name="birthday"
                  label="Birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  name="time_zone"
                  label="Timezone"
                  value={formData.time_zone}
                  onChange={handleChange}
                  size="small"
                  placeholder="e.g. America/New_York"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Connected Accounts Card */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 4, sm: 5 }, "&:last-child": { pb: { xs: 4, sm: 5 } } }}>
              {sectionTitle("Connected Accounts")}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isGoogleLinked
                        ? "primary.main"
                        : "action.disabledBackground",
                    }}
                  >
                    <GoogleIcon
                      sx={{
                        fontSize: 20,
                        color: isGoogleLinked ? "primary.contrastText" : "text.disabled",
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Google Calendar
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {isGoogleLinked
                        ? "Connected — calendar sync active"
                        : "Not connected"}
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  icon={
                    isGoogleLinked ? (
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <LinkOffIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  label={isGoogleLinked ? "Linked" : "Not linked"}
                  size="small"
                  color={isGoogleLinked ? "success" : "default"}
                  variant={isGoogleLinked ? "filled" : "outlined"}
                  sx={{ fontWeight: 500 }}
                />
              </Box>

              {!isGoogleLinked && (
                <>
                  <Divider sx={{ my: 4 }} />
                  <Button
                    component="a"
                    href={`${process.env.REACT_APP_SERVER_URL}/auth/google`}
                    variant="outlined"
                    size="small"
                    startIcon={<GoogleIcon />}
                    sx={{
                      textTransform: "none",
                      borderColor: "divider",
                      color: "text.primary",
                      "&:hover": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    Connect Google Calendar
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{
                px: 6,
                textTransform: "none",
                borderColor: "divider",
                color: "text.secondary",
                "&:hover": { borderColor: "text.secondary" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                px: 8,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "primary.main",
                boxShadow: tokens.shadows.medium,
                "&:hover": {
                  bgcolor: "primary.light",
                  boxShadow: tokens.shadows.elevated,
                },
              }}
            >
              {saving ? (
                <CircularProgress size={20} sx={{ color: "inherit" }} />
              ) : (
                "Save Changes"
              )}
            </Button>
          </Box>
        </Box>

        {/* Success Snackbar */}
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
