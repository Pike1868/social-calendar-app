import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
  Toolbar,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleGoogleEventsVisibility,
  selectShowGoogleEvents,
  selectCalendarList,
  selectCalendarVisibility,
  toggleCalendarVisibility,
} from "../../redux/googleEventSlice";
import {
  toggleLocalEventsVisibility,
  selectShowLocalEvents,
} from "../../redux/eventSlice";
import { selectUserDetails } from "../../redux/userSlice";
import { layout } from "../../theme";

const navItems = [
  { label: "Calendar", icon: <CalendarMonthIcon />, path: "/home" },
  { label: "Friends", icon: <PeopleOutlineIcon />, path: "/friends" },
  { label: "Find a Time", icon: <EventAvailableOutlinedIcon />, path: "/find-a-time" },
  {
    label: "Suggestions",
    icon: <LightbulbOutlinedIcon />,
    path: "/suggestions",
  },
  { label: "Profile", icon: <PersonOutlineIcon />, path: "/profile" },
];

const DesktopSidebar = ({ open }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const showLocalEvents = useSelector(selectShowLocalEvents);
  const showGoogleEvents = useSelector(selectShowGoogleEvents);
  const userDetails = useSelector(selectUserDetails);
  const calendarList = useSelector(selectCalendarList);
  const calendarVisibility = useSelector(selectCalendarVisibility);

  const drawerWidth = open ? layout.sidebarWidth : layout.sidebarCollapsedWidth;

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: layout.transitionDuration,
        }),
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          overflowX: "hidden",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: layout.transitionDuration,
          }),
          borderRight: `1px solid ${theme.palette.divider}`,
          boxSizing: "border-box",
        },
      }}
    >
      {/* Spacer for the AppBar */}
      <Toolbar />

      {/* Navigation links */}
      <List sx={{ mt: 1, px: open ? 1 : 0.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={open ? "" : item.label} placement="right" arrow>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                    px: 2.5,
                    borderRadius: 2,
                    mx: open ? 0 : 0.5,
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                      },
                      "& .MuiListItemIcon-root": {
                        color: theme.palette.primary.contrastText,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      opacity: open ? 1 : 0,
                      transition: theme.transitions.create("opacity", {
                        duration: layout.transitionDuration,
                      }),
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Calendar filters — only when expanded */}
      {open && (
        <>
          <Divider sx={{ my: 2, mx: 2 }} />
          <Box sx={{ px: 3 }}>
            <Typography
              variant="overline"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              Calendars
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showLocalEvents}
                  onChange={() => dispatch(toggleLocalEventsVisibility())}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">Local Calendar</Typography>
              }
              sx={{ mt: 1, ml: -0.5 }}
            />
            {userDetails && userDetails.access_token && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showGoogleEvents}
                      onChange={() => dispatch(toggleGoogleEventsVisibility())}
                      size="small"
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Google Calendar
                    </Typography>
                  }
                  sx={{ ml: -0.5 }}
                />
                {showGoogleEvents && calendarList.length > 0 && (
                  <Box sx={{ pl: 3 }}>
                    {calendarList.map((cal) => (
                      <FormControlLabel
                        key={cal.id}
                        control={
                          <Checkbox
                            checked={calendarVisibility[cal.id] !== false}
                            onChange={() => dispatch(toggleCalendarVisibility(cal.id))}
                            size="small"
                            sx={{
                              color: cal.color,
                              "&.Mui-checked": {
                                color: cal.color,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.8rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 140,
                              display: "block",
                            }}
                          >
                            {cal.name}
                          </Typography>
                        }
                        sx={{ ml: -0.5, mr: 0, display: "flex" }}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default DesktopSidebar;
