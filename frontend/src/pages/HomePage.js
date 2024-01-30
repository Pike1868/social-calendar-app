import React from "react";
import { Box, Container, Typography } from "@mui/material";

const HomePage = () => {
  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
