import React, { useState } from "react";
import { Box, Container, Grid } from "@mui/material";
import Calendar from "../components/calendar/Calendar";
import Sidebar from "../components/Sidebar";
import HomeNavBar from "../components/HomeNavBar";

const drawerWidth = 340;

export default function Homepage() {
  const [open, setOpen] = useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <HomeNavBar open={open} toggleDrawer={toggleDrawer} />
      <Sidebar
        open={open}
        toggleDrawer={toggleDrawer}
        drawerWidth={drawerWidth}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Container maxWidth="xl" sx={{ pt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Calendar />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
