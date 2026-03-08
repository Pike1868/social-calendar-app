import React, { useState } from "react";
import { Box, Toolbar, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import TopAppBar from "./TopAppBar";
import DesktopSidebar from "./DesktopSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { layout } from "../../theme";

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const sidebarWidth = sidebarOpen
    ? layout.sidebarWidth
    : layout.sidebarCollapsedWidth;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Top App Bar */}
      <TopAppBar onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Desktop Sidebar */}
      {!isMobile && <DesktopSidebar open={sidebarOpen} />}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: "100%",
            md: `calc(100% - ${sidebarWidth}px)`,
          },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: layout.transitionDuration,
          }),
          overflow: "auto",
          // Account for fixed top bar
          pb: isMobile ? `${layout.bottomNavHeight + 16}px` : 0,
        }}
      >
        {/* Spacer for fixed AppBar */}
        <Toolbar />

        {/* Page content via Outlet */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </Box>
  );
};

export default AppLayout;
