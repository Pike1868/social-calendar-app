import React from "react";
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
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userSlice";
import { resetState } from "../../redux/helpers/globalActions";
import { useThemeMode } from "../../ThemeContext";
import { layout } from "../../theme";

const TopAppBar = ({ onMenuToggle, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();

  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchor);

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
        <IconButton color="inherit" aria-label="notifications">
          <Badge badgeContent={0} color="secondary">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

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
