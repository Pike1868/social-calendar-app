import React from "react";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useNavigate, useLocation } from "react-router-dom";
import { layout } from "../../theme";

const tabs = [
  { label: "Calendar", icon: <CalendarMonthIcon />, path: "/home" },
  { label: "Friends", icon: <PeopleOutlineIcon />, path: "/friends" },
  { label: "Find a Time", icon: <EventAvailableOutlinedIcon />, path: "/find-a-time" },
  { label: "Suggestions", icon: <LightbulbOutlinedIcon />, path: "/suggestions" },
  { label: "Profile", icon: <PersonOutlineIcon />, path: "/profile" },
];

const MobileBottomNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = tabs.findIndex((tab) => tab.path === location.pathname);
  const activeIndex = currentTab >= 0 ? currentTab : 0;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <BottomNavigation
        value={activeIndex}
        onChange={(_, newValue) => {
          navigate(tabs[newValue].path);
        }}
        showLabels
        sx={{
          height: layout.bottomNavHeight,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            py: 1,
            color: theme.palette.text.secondary,
            "&.Mui-selected": {
              color: theme.palette.primary.main,
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.7rem",
            "&.Mui-selected": {
              fontSize: "0.75rem",
            },
          },
        }}
      />
    </Paper>
  );
};

export default MobileBottomNav;
