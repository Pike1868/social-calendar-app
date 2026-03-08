import React, { useEffect, useState, useCallback } from "react";
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
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import serverAPI from "../api/serverAPI";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFriends,
  fetchFriendRequests,
  fetchCircles,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  createCircle,
  deleteCircle,
  addCircleMember,
  removeCircleMember,
  clearFriendError,
  selectFriends,
  selectFriendRequests,
  selectCircles,
  selectFriendsLoading,
  selectRequestsLoading,
  selectCirclesLoading,
  selectFriendError,
} from "../redux/friendSlice";
import { tokens } from "../theme";

function getInitials(first, last, displayName) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (displayName) return displayName[0].toUpperCase();
  return "?";
}

function getDisplayName(friend) {
  if (friend.display_name) return friend.display_name;
  if (friend.first_name && friend.last_name)
    return `${friend.first_name} ${friend.last_name}`;
  if (friend.first_name) return friend.first_name;
  return friend.email;
}

// ── Card style shared across sections ──
const cardSx = {
  borderRadius: 3,
  boxShadow: tokens.shadows.subtle,
  border: "1px solid",
  borderColor: "divider",
  overflow: "visible",
};

// ── Section Header ──
function SectionTitle({ children }) {
  return (
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
      {children}
    </Typography>
  );
}

// ── Friend Card ──
function FriendCard({ friend, onRemove, circles, onAddToCircle, onRemoveFromCircle }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [circleMenuAnchor, setCircleMenuAnchor] = useState(null);

  const friendCircles = circles.filter((c) =>
    c.members.some((m) => m.user_id === friend.user_id)
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        py: 2.5,
        px: 1,
        borderRadius: 2,
        transition: "background-color 0.15s",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Avatar
        src={friend.avatar_url || undefined}
        sx={{
          width: 44,
          height: 44,
          fontSize: "0.95rem",
          fontWeight: 600,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        {!friend.avatar_url &&
          getInitials(friend.first_name, friend.last_name, friend.display_name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
          {getDisplayName(friend)}
        </Typography>
        {friend.home_city && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
              {friend.home_city}
            </Typography>
          </Box>
        )}
        {friendCircles.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            {friendCircles.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                size="small"
                variant="outlined"
                onDelete={() => onRemoveFromCircle(c.id, friend.user_id)}
                sx={{ height: 22, fontSize: "0.7rem" }}
              />
            ))}
          </Box>
        )}
      </Box>

      <IconButton
        size="small"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{ color: "text.secondary" }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, boxShadow: tokens.shadows.medium } } }}
      >
        <MenuItem
          onClick={(e) => {
            setMenuAnchor(null);
            setCircleMenuAnchor(e.currentTarget);
          }}
        >
          <ListItemIcon>
            <AddCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add to circle</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onRemove(friend.friendship_id);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <PersonRemoveOutlinedIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          <ListItemText>Remove friend</ListItemText>
        </MenuItem>
      </Menu>

      {/* Circle sub-menu */}
      <Menu
        anchorEl={circleMenuAnchor}
        open={Boolean(circleMenuAnchor)}
        onClose={() => setCircleMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 160, borderRadius: 2, boxShadow: tokens.shadows.medium } } }}
      >
        {circles.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No circles yet
            </Typography>
          </MenuItem>
        ) : (
          circles.map((c) => {
            const isMember = c.members.some((m) => m.user_id === friend.user_id);
            return (
              <MenuItem
                key={c.id}
                onClick={() => {
                  setCircleMenuAnchor(null);
                  if (isMember) {
                    onRemoveFromCircle(c.id, friend.user_id);
                  } else {
                    onAddToCircle(c.id, friend.user_id);
                  }
                }}
              >
                <ListItemIcon>
                  {isMember ? (
                    <RemoveCircleOutlineIcon fontSize="small" sx={{ color: "error.main" }} />
                  ) : (
                    <AddCircleOutlineIcon fontSize="small" sx={{ color: "primary.main" }} />
                  )}
                </ListItemIcon>
                <ListItemText>{c.name}</ListItemText>
                {isMember && (
                  <CheckIcon sx={{ fontSize: 16, color: "primary.main", ml: 1 }} />
                )}
              </MenuItem>
            );
          })
        )}
      </Menu>
    </Box>
  );
}

// ── Request Card ──
function RequestCard({ request, onAccept, onDecline, loading }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        py: 2.5,
        px: 1,
        borderRadius: 2,
      }}
    >
      <Avatar
        src={request.avatar_url || undefined}
        sx={{
          width: 44,
          height: 44,
          fontSize: "0.95rem",
          fontWeight: 600,
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
        }}
      >
        {!request.avatar_url &&
          getInitials(request.first_name, request.last_name, request.display_name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
          {getDisplayName(request)}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
          {request.email}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => onAccept(request.friendship_id)}
          disabled={loading}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            width: 34,
            height: 34,
            "&:hover": { bgcolor: "primary.light" },
          }}
        >
          <CheckIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDecline(request.friendship_id)}
          disabled={loading}
          sx={{
            bgcolor: "action.hover",
            color: "text.secondary",
            width: 34,
            height: 34,
            "&:hover": { bgcolor: "error.main", color: "error.contrastText" },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ── Empty State ──
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 6,
        px: 4,
      }}
    >
      <Icon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, mb: 2 }} />
      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

// ── Main Page ──
export default function FriendsPage() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const friends = useSelector(selectFriends);
  const requests = useSelector(selectFriendRequests);
  const circles = useSelector(selectCircles);
  const loading = useSelector(selectFriendsLoading);
  const requestsLoading = useSelector(selectRequestsLoading);
  const circlesLoading = useSelector(selectCirclesLoading);
  const error = useSelector(selectFriendError);

  const [searchEmail, setSearchEmail] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [createCircleOpen, setCreateCircleOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [requestsExpanded, setRequestsExpanded] = useState(true);
  const [circlesExpanded, setCirclesExpanded] = useState(true);
  const [allFriendsExpanded, setAllFriendsExpanded] = useState(true);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);

  const showSnack = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Load data on mount
  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchFriendRequests());
    dispatch(fetchCircles());
  }, [dispatch]);

  // Clear errors
  useEffect(() => {
    if (error) {
      const msg = Array.isArray(error) ? error[0] : error;
      showSnack(msg, "error");
      dispatch(clearFriendError());
    }
  }, [error, dispatch, showSnack]);

  // ── Handlers ──

  const handleShareInviteLink = async () => {
    setInviteLinkLoading(true);
    try {
      const result = await serverAPI.generateInviteLink();
      await navigator.clipboard.writeText(result.link);
      showSnack("Invite link copied to clipboard!");
    } catch (err) {
      showSnack("Failed to generate invite link", "error");
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSendingRequest(true);
    try {
      await dispatch(sendFriendRequest(searchEmail.trim())).unwrap();
      showSnack("Friend request sent!");
      setSearchEmail("");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await dispatch(acceptFriendRequest(friendshipId)).unwrap();
      dispatch(fetchFriends()); // refresh friends list
      showSnack("Friend request accepted!");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleDecline = async (friendshipId) => {
    try {
      await dispatch(declineFriendRequest(friendshipId)).unwrap();
      showSnack("Friend request declined");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    try {
      await dispatch(removeFriend(friendshipId)).unwrap();
      showSnack("Friend removed");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return;
    try {
      await dispatch(createCircle(newCircleName.trim())).unwrap();
      showSnack("Circle created!");
      setNewCircleName("");
      setCreateCircleOpen(false);
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleDeleteCircle = async (circleId) => {
    try {
      await dispatch(deleteCircle(circleId)).unwrap();
      showSnack("Circle deleted");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleAddToCircle = async (circleId, userId) => {
    try {
      await dispatch(addCircleMember({ circleId, userId })).unwrap();
      dispatch(fetchCircles()); // refresh for updated members
      showSnack("Added to circle");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  const handleRemoveFromCircle = async (circleId, userId) => {
    try {
      await dispatch(removeCircleMember({ circleId, userId })).unwrap();
      showSnack("Removed from circle");
    } catch (err) {
      const msg = Array.isArray(err) ? err[0] : err;
      showSnack(msg, "error");
    }
  };

  // ── Build grouped view: friends by circle, plus uncategorized ──
  const categorizedUserIds = new Set();
  circles.forEach((c) => c.members.forEach((m) => categorizedUserIds.add(m.user_id)));
  const uncategorizedFriends = friends.filter(
    (f) => !categorizedUserIds.has(f.user_id)
  );

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
            Friends
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={inviteLinkLoading ? <CircularProgress size={16} /> : <LinkIcon />}
              onClick={handleShareInviteLink}
              disabled={inviteLinkLoading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderColor: "divider",
                color: "text.primary",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              Share Invite Link
            </Button>
            <Chip
              label={`${friends.length} friend${friends.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            maxWidth: 640,
            mx: "auto",
            px: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* ─── Add Friend Search ─── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
              <SectionTitle>Add a Friend</SectionTitle>
              <Box
                component="form"
                onSubmit={handleSendRequest}
                sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter friend's email address"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={sendingRequest || !searchEmail.trim()}
                  sx={{
                    minWidth: isMobile ? 44 : "auto",
                    px: isMobile ? 0 : 4,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                  startIcon={!isMobile && !sendingRequest ? <PersonAddOutlinedIcon /> : undefined}
                >
                  {sendingRequest ? (
                    <CircularProgress size={20} sx={{ color: "inherit" }} />
                  ) : isMobile ? (
                    <PersonAddOutlinedIcon />
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* ─── Pending Requests ─── */}
          {(requests.length > 0 || requestsLoading) && (
            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    mb: requestsExpanded ? 2 : 0,
                  }}
                  onClick={() => setRequestsExpanded(!requestsExpanded)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <SectionTitle>Pending Requests</SectionTitle>
                    <Chip
                      label={requests.length}
                      size="small"
                      color="secondary"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        mt: -3,
                      }}
                    />
                  </Box>
                  {requestsExpanded ? (
                    <ExpandLessIcon sx={{ color: "text.secondary", mt: -3 }} />
                  ) : (
                    <ExpandMoreIcon sx={{ color: "text.secondary", mt: -3 }} />
                  )}
                </Box>

                <Collapse in={requestsExpanded}>
                  {requestsLoading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[1, 2].map((i) => (
                        <Skeleton key={i} variant="rounded" height={56} />
                      ))}
                    </Box>
                  ) : (
                    requests.map((request) => (
                      <RequestCard
                        key={request.friendship_id}
                        request={request}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        loading={false}
                      />
                    ))
                  )}
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* ─── Circles ─── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  mb: circlesExpanded ? 2 : 0,
                }}
                onClick={() => setCirclesExpanded(!circlesExpanded)}
              >
                <SectionTitle>Circles</SectionTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: -3 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateCircleOpen(true);
                    }}
                    sx={{ color: "primary.main" }}
                  >
                    <GroupAddOutlinedIcon fontSize="small" />
                  </IconButton>
                  {circlesExpanded ? (
                    <ExpandLessIcon sx={{ color: "text.secondary" }} />
                  ) : (
                    <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                  )}
                </Box>
              </Box>

              <Collapse in={circlesExpanded}>
                {circlesLoading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[1, 2].map((i) => (
                      <Skeleton key={i} variant="rounded" height={80} />
                    ))}
                  </Box>
                ) : circles.length === 0 ? (
                  <EmptyState
                    icon={PeopleOutlineIcon}
                    title="No circles yet"
                    subtitle="Create a circle to group your friends — like Family, College, or Coworkers"
                  />
                ) : (
                  circles.map((circle) => (
                    <Box key={circle.id} sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <PeopleOutlineIcon
                            sx={{ fontSize: 18, color: "secondary.main" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {circle.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            ({circle.members.length})
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCircle(circle.id)}
                          sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>

                      {circle.members.length === 0 ? (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", pl: 4.5 }}
                        >
                          No members yet — use the menu on a friend card to add them
                        </Typography>
                      ) : (
                        <Box sx={{ pl: 1 }}>
                          {circle.members.map((member) => (
                            <Box
                              key={member.user_id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1,
                                pl: 3,
                              }}
                            >
                              <Avatar
                                src={member.avatar_url || undefined}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  bgcolor: "primary.main",
                                  color: "primary.contrastText",
                                }}
                              >
                                {!member.avatar_url &&
                                  getInitials(
                                    member.first_name,
                                    member.last_name,
                                    member.display_name
                                  )}
                              </Avatar>
                              <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                                {getDisplayName(member)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleRemoveFromCircle(circle.id, member.user_id)
                                }
                                sx={{
                                  color: "text.secondary",
                                  "&:hover": { color: "error.main" },
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {circle !== circles[circles.length - 1] && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* ─── All Friends ─── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, "&:last-child": { pb: { xs: 3, sm: 4 } } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  mb: allFriendsExpanded ? 2 : 0,
                }}
                onClick={() => setAllFriendsExpanded(!allFriendsExpanded)}
              >
                <SectionTitle>All Friends</SectionTitle>
                {allFriendsExpanded ? (
                  <ExpandLessIcon sx={{ color: "text.secondary", mt: -3 }} />
                ) : (
                  <ExpandMoreIcon sx={{ color: "text.secondary", mt: -3 }} />
                )}
              </Box>

              <Collapse in={allFriendsExpanded}>
                {loading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rounded" height={56} />
                    ))}
                  </Box>
                ) : friends.length === 0 ? (
                  <EmptyState
                    icon={PersonAddOutlinedIcon}
                    title="No friends yet"
                    subtitle="Search by email above to send your first friend request"
                  />
                ) : (
                  friends.map((friend) => (
                    <FriendCard
                      key={friend.friendship_id}
                      friend={friend}
                      onRemove={handleRemoveFriend}
                      circles={circles}
                      onAddToCircle={handleAddToCircle}
                      onRemoveFromCircle={handleRemoveFromCircle}
                    />
                  ))
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        {/* ─── Create Circle Dialog ─── */}
        <Dialog
          open={createCircleOpen}
          onClose={() => {
            setCreateCircleOpen(false);
            setNewCircleName("");
          }}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Create a Circle</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Circles help you group friends — like Family, College Crew, or Work.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Circle name"
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCircle();
                }
              }}
              placeholder="e.g. Family, College Friends"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => {
                setCreateCircleOpen(false);
                setNewCircleName("");
              }}
              sx={{ color: "text.secondary" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCircle}
              disabled={!newCircleName.trim()}
              sx={{ fontWeight: 600 }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

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
