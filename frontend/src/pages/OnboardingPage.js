import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  IconButton,
  Chip,
  Fade,
  LinearProgress,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useDispatch, useSelector } from "react-redux";
import { completeOnboarding, selectUserDetails } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { tokens } from "../theme";
import serverAPI from "../api/serverAPI";
import CityAutocompleteField from "../components/CityAutocompleteField";

const STEPS = [
  { label: "Profile", icon: PersonOutlineIcon },
  { label: "Location", icon: LocationOnOutlinedIcon },
  { label: "Friends", icon: GroupAddOutlinedIcon },
  { label: "Privacy", icon: ShieldOutlinedIcon },
];


export default function OnboardingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userDetails = useSelector(selectUserDetails);
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Profile
  const [displayName, setDisplayName] = useState(
    userDetails?.display_name ||
      [userDetails?.first_name, userDetails?.last_name].filter(Boolean).join(" ") ||
      ""
  );
  const [avatarPreview, setAvatarPreview] = useState(userDetails?.avatar_url || null);
  const [avatarDataUrl, setAvatarDataUrl] = useState(null);

  // Step 2: City
  const [homeCity, setHomeCity] = useState(userDetails?.home_city || "");

  // Step 3: Invite friends
  const [emailInput, setEmailInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteError, setInviteError] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResults, setInviteResults] = useState(null);

  // Invite link state
  const [inviteLink, setInviteLink] = useState("");
  const [linkGenerating, setLinkGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const progress = ((activeStep + 1) / STEPS.length) * 100;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInviteError("Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(email)) {
      setInviteError("Email already added");
      return;
    }
    if (inviteEmails.length >= 10) {
      setInviteError("Maximum 10 invites at once");
      return;
    }

    setInviteEmails((prev) => [...prev, email]);
    setEmailInput("");
    setInviteError("");
  };

  const removeEmail = (email) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const handleGenerateLink = async () => {
    setLinkGenerating(true);
    try {
      const result = await serverAPI.generateInviteLink();
      setInviteLink(result.link);
      setLinkCopied(false);
    } catch (err) {
      setInviteError("Failed to generate invite link. Try again.");
    } finally {
      setLinkGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setInviteError("Failed to copy link");
    }
  };

  const sendInvites = async () => {
    if (inviteEmails.length === 0) return;
    setInviteSending(true);
    try {
      const results = await serverAPI.inviteFriendsBatch(inviteEmails);
      setInviteResults(results);
    } catch (err) {
      setInviteError("Failed to send some invites. You can try again later.");
    } finally {
      setInviteSending(false);
    }
  };

  const handleNext = async () => {
    // Send invites when leaving step 3
    if (activeStep === 2 && inviteEmails.length > 0 && !inviteResults) {
      await sendInvites();
    }
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const profileData = {};
      if (displayName) profileData.display_name = displayName;
      if (homeCity) profileData.home_city = homeCity;
      if (avatarDataUrl) profileData.avatar_url = avatarDataUrl;

      await dispatch(completeOnboarding(profileData)).unwrap();
      navigate("/home");
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await dispatch(completeOnboarding({})).unwrap();
      navigate("/home");
    } catch (err) {
      console.error("Error skipping onboarding:", err);
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (displayName) return displayName[0].toUpperCase();
    if (userDetails?.first_name) return userDetails.first_name[0].toUpperCase();
    return "?";
  };

  const containerSx = {
    minHeight: "100vh",
    bgcolor: "background.default",
    display: "flex",
    flexDirection: "column",
  };

  const contentSx = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    px: { xs: 4, sm: 6 },
    py: { xs: 6, sm: 8 },
    maxWidth: 520,
    mx: "auto",
    width: "100%",
  };

  const renderStepIndicator = () => (
    <Box sx={{ width: "100%", mb: 8 }}>
      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: "divider",
          mb: 4,
          "& .MuiLinearProgress-bar": {
            bgcolor: "secondary.main",
            borderRadius: 2,
          },
        }}
      />

      {/* Step dots */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;

          return (
            <Box
              key={step.label}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isActive
                    ? "primary.main"
                    : isDone
                    ? "secondary.main"
                    : "action.disabledBackground",
                  transition: "all 0.3s ease",
                }}
              >
                <Icon
                  sx={{
                    fontSize: 18,
                    color: isActive || isDone ? "#fff" : "text.disabled",
                  }}
                />
              </Box>
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "text.primary" : "text.secondary",
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {step.label}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const renderStep1 = () => (
    <Fade in timeout={300} key="step1">
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Welcome to Circl
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 8, maxWidth: 360, mx: "auto" }}
        >
          Let's set up your profile so your friends can find you.
        </Typography>

        {/* Avatar */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 6,
          }}
        >
          <Box sx={{ position: "relative", mb: 2 }}>
            <Avatar
              src={avatarPreview || undefined}
              sx={{
                width: 96,
                height: 96,
                fontSize: "2rem",
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                cursor: "pointer",
                transition: "opacity 0.2s",
                "&:hover": { opacity: 0.85 },
              }}
              onClick={handleAvatarClick}
            >
              {!avatarPreview && getInitials()}
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
                width: 30,
                height: 30,
                "&:hover": { bgcolor: "secondary.dark" },
                boxShadow: tokens.shadows.medium,
              }}
            >
              <CameraAltIcon sx={{ fontSize: 15 }} />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={handleAvatarChange}
            />
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Tap to upload a photo
          </Typography>
        </Box>

        {/* Display name */}
        <TextField
          fullWidth
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How your friends will see you"
          size="small"
          sx={{ maxWidth: 360, mx: "auto" }}
        />
      </Box>
    </Fade>
  );

  const renderStep2 = () => (
    <Fade in timeout={300} key="step2">
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 4,
          }}
        >
          <LocationOnOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Where are you based?
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 8, maxWidth: 360, mx: "auto" }}
        >
          We'll use this to suggest events and activities near you.
        </Typography>

        <CityAutocompleteField
          value={homeCity}
          onChange={setHomeCity}
          label="Home City"
          placeholder="Start typing your city..."
          size="small"
          showLocationButton
          sx={{ maxWidth: 360, mx: "auto" }}
        />
      </Box>
    </Fade>
  );

  const renderStep3 = () => (
    <Fade in timeout={300} key="step3">
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 4,
          }}
        >
          <GroupAddOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Invite your people
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 6, maxWidth: 380, mx: "auto" }}
        >
          Add friends and family you'd like to stay connected with. They'll get a
          friend request when they join.
        </Typography>

        <Box sx={{ maxWidth: 400, mx: "auto" }}>
          {/* Generate Invite Link */}
          <Box sx={{ mb: 4 }}>
            <Button
              variant="contained"
              onClick={handleGenerateLink}
              disabled={linkGenerating}
              startIcon={linkGenerating ? undefined : <LinkIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                width: "100%",
                mb: 2,
              }}
            >
              {linkGenerating ? (
                <CircularProgress size={20} sx={{ color: "inherit" }} />
              ) : (
                "Generate Invite Link"
              )}
            </Button>

            {inviteLink && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "text.secondary",
                  }}
                >
                  {inviteLink}
                </Typography>
                <IconButton size="small" onClick={handleCopyLink}>
                  {linkCopied ? (
                    <CheckIcon sx={{ fontSize: 18, color: "success.main" }} />
                  ) : (
                    <ContentCopyIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  )}
                </IconButton>
              </Box>
            )}
          </Box>

          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary", mb: 3, textAlign: "center" }}
          >
            Or invite by email
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Email address"
              placeholder="friend@example.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setInviteError("");
              }}
              onKeyDown={handleEmailKeyDown}
              error={!!inviteError}
              helperText={inviteError}
            />
            <Button
              variant="outlined"
              onClick={addEmail}
              sx={{
                minWidth: 64,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              Add
            </Button>
          </Box>

          {inviteEmails.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "center",
                mb: 3,
              }}
            >
              {inviteEmails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  size="small"
                  onDelete={() => removeEmail(email)}
                  deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    bgcolor: "action.hover",
                    "& .MuiChip-deleteIcon": {
                      color: "text.secondary",
                      "&:hover": { color: "error.main" },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {inviteResults && (
            <Box sx={{ mt: 3 }}>
              {inviteResults.map((r) => (
                <Typography
                  key={r.email}
                  variant="caption"
                  sx={{
                    display: "block",
                    color: r.status === "sent" ? "success.main" : "text.secondary",
                    mb: 1,
                  }}
                >
                  {r.email}: {r.status === "sent" ? "Invite sent!" : r.error || "Could not send"}
                </Typography>
              ))}
            </Box>
          )}

          {inviteSending && (
            <CircularProgress size={24} sx={{ mt: 2, color: "primary.main" }} />
          )}
        </Box>
      </Box>
    </Fade>
  );

  const renderStep4 = () => (
    <Fade in timeout={300} key="step4">
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 4,
          }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Your privacy matters
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 8, maxWidth: 380, mx: "auto" }}
        >
          Here's how Circl keeps your calendar private.
        </Typography>

        <Box sx={{ maxWidth: 400, mx: "auto", textAlign: "left" }}>
          {[
            {
              icon: VisibilityOffOutlinedIcon,
              title: "Free/Busy only",
              desc: "Friends see when you're free or busy — never your event details, titles, or locations.",
            },
            {
              icon: LockOutlinedIcon,
              title: "You're in control",
              desc: "Choose exactly who can see your availability. Block or remove anyone, anytime.",
            },
            {
              icon: PeopleOutlineIcon,
              title: "No public profiles",
              desc: "Your information is only visible to people you've accepted as friends.",
            },
          ].map((item, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                gap: 3,
                mb: i < 2 ? 5 : 0,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <item.icon sx={{ fontSize: 20, color: "secondary.main" }} />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", lineHeight: 1.5 }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Fade>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <Box sx={containerSx}>
      {/* Header with skip */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 4, sm: 6 },
          py: 3,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: "primary.main",
            letterSpacing: "0.02em",
          }}
        >
          circl
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={handleSkip}
          disabled={saving}
          sx={{
            color: "text.secondary",
            textTransform: "none",
            fontSize: "0.8rem",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          Skip for now
        </Button>
      </Box>

      {/* Content */}
      <Box sx={contentSx}>
        {renderStepIndicator()}

        {steps[activeStep]()}

        {/* Navigation buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 400,
            mt: 10,
            gap: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
            sx={{
              flex: 1,
              textTransform: "none",
              borderColor: "divider",
              color: "text.secondary",
              visibility: activeStep === 0 ? "hidden" : "visible",
              "&:hover": { borderColor: "text.secondary" },
            }}
          >
            Back
          </Button>

          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={inviteSending}
              sx={{
                flex: 1,
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
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleFinish}
              disabled={saving}
              sx={{
                flex: 1,
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
                boxShadow: tokens.shadows.medium,
                "&:hover": {
                  bgcolor: "secondary.dark",
                  boxShadow: tokens.shadows.elevated,
                },
              }}
            >
              {saving ? (
                <CircularProgress size={20} sx={{ color: "inherit" }} />
              ) : (
                "Get Started"
              )}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
