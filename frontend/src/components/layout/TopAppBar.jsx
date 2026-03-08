import React, { useEffect, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  InputBase,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Popover,
  List,
  ListItem,
  ListItemButton,
  Divider,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../redux/userSlice";
import { resetState } from "../../redux/helpers/globalActions";
import { useThemeMode } from "../../ThemeContext";
import { layout } from "../../theme";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
} from "../../redux/notificationSlice";

const NOTIFICATION_ICONS = {
  friend_request: PersonAddOutlinedIcon,
  friend_accepted: PersonOutlineIcon,
  event: EventOutlinedIcon,
  circle: GroupOutlinedIcon,
};

function getNotificationIcon(type) {
  const Icon = NOTIFICATION_ICONS[type] || InfoOutlinedIcon;
  return <Icon fontSize="small" />;
}

function formatTimestamp(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

const POLL_INTERVAL = 60000; // 60 seconds

const TopAppBar = ({ onMenuToggle, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();

  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchor);

  const [notifAnchor, setNotifAnchor] = React.useState(null);
  const notifOpen = Boolean(notifAnchor);

  // Fetch unread count on mount and poll every 60 seconds
  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleNotifOpen = useCallback(
    (e) => {
      setNotifAnchor(e.currentTarget);
      dispatch(fetchNotifications());
    },
    [dispatch]
  );

  const handleNotifClose = useCallback(() => {
    setNotifAnchor(null);
  }, []);

  const handleNotifClick = useCallback(
    (id) => {
      dispatch(markNotificationRead(id));
    },
    [dispatch]
  );

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  const logout = () => {
    setMobileMenuAnchor(null);
    localStorage.removeItem("socialCalToken");
    dispatch(setUser(null));
    dispatch(resetState());
    navigate("/");
  };

  const handleProfileClick = () => {
    setMobileMenuAnchor(null);
    navigate("/profile");
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: layout.transitionDuration,
        }),
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        {/* Menu toggle — only on desktop (mobile uses bottom nav) */}
        {!isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle sidebar"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* App title */}
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.02em",
            mr: 2,
            minWidth: "fit-content",
          }}
        >
          Circl
        </Typography>

        {/* Desktop search bar */}
        {!isMobile && (
          <Box
            sx={{
              position: "relative",
              borderRadius: theme.shape.borderRadius,
              backgroundColor: alpha(theme.palette.common.white, 0.15),
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.white, 0.25),
              },
              ml: 1,
              mr: 2,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Box
              sx={{
                px: 2,
                height: "100%",
                position: "absolute",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SearchIcon sx={{ fontSize: 20 }} />
            </Box>
            <InputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
              sx={{
                color: "inherit",
                width: "100%",
                "& .MuiInputBase-input": {
                  padding: theme.spacing(2, 2, 2, 0),
                  paddingLeft: `calc(1em + ${theme.spacing(8)})`,
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Notification bell — shown on both mobile & desktop */}
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={handleNotifOpen}
        >
          <Badge
            badgeContent={unreadCount}
            color="secondary"
            max={99}
          >
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        {/* Notification dropdown */}
        <Popover
          open={notifOpen}
          anchorEl={notifAnchor}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                width: 360,
                maxHeight: 480,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              },
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 4,
              py: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Mark all as read
              </Button>
            )}
          </Box>

          {/* Notification list */}
          <List
            sx={{
              overflowY: "auto",
              flexGrow: 1,
              py: 0,
            }}
          >
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications yet"
                  sx={{ textAlign: "center", color: theme.palette.text.secondary }}
                />
              </ListItem>
            ) : (
              notifications.map((notif, idx) => (
                <React.Fragment key={notif.id}>
                  <ListItemButton
                    onClick={() => handleNotifClick(notif.id)}
                    sx={{
                      py: 3,
                      px: 4,
                      backgroundColor: notif.read
                        ? "transparent"
                        : alpha(theme.palette.primary.main, 0.06),
                      "&:hover": {
                        backgroundColor: notif.read
                          ? alpha(theme.palette.action.hover, 0.04)
                          : alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: notif.read
                          ? theme.palette.text.secondary
                          : theme.palette.primary.main,
                      }}
                    >
                      {getNotificationIcon(notif.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notif.title}
                      secondary={
                        <Box
                          component="span"
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          {notif.body && (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{
                                color: theme.palette.text.secondary,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {notif.body}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            component="span"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {formatTimestamp(notif.created_at)}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: notif.read ? 400 : 600,
                        sx: {
                          color: notif.read
                            ? theme.palette.text.primary
                            : theme.palette.text.primary,
                        },
                      }}
                    />
                    {!notif.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: theme.palette.primary.main,
                          ml: 2,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </ListItemButton>
                  {idx < notifications.length - 1 && (
                    <Divider component="li" />
                  )}
                </React.Fragment>
              ))
            )}
          </List>
        </Popover>

        {/* Desktop: theme toggle, profile, logout */}
        {!isMobile && (
          <>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              aria-label="toggle theme"
              sx={{ ml: 1 }}
            >
              {mode === "dark" ? (
                <LightModeOutlinedIcon />
              ) : (
                <DarkModeOutlinedIcon />
              )}
            </IconButton>
            <Button
              color="inherit"
              onClick={handleProfileClick}
              sx={{ ml: 1, fontWeight: 600 }}
            >
              Profile
            </Button>
            <Button
              color="inherit"
              onClick={logout}
              sx={{ ml: 1, fontWeight: 600 }}
            >
              Log Out
            </Button>
          </>
        )}

        {/* Mobile: hamburger for secondary actions */}
        {isMobile && (
          <>
            <IconButton
              color="inherit"
              aria-label="more options"
              onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={mobileMenuOpen}
              onClose={() => setMobileMenuAnchor(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <PersonOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={toggleTheme}>
                <ListItemIcon>
                  {mode === "dark" ? (
                    <LightModeOutlinedIcon fontSize="small" />
                  ) : (
                    <DarkModeOutlinedIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {mode === "dark" ? "Light Mode" : "Dark Mode"}
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={logout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Log Out</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default TopAppBar;
