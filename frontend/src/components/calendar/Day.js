import React from "react";
import { Box, Grid } from "@mui/material";

export default function Day({ day }) {
  return (
    <Grid
      item
      sx={{
        border: 1,
        borderColor: "grey",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: "5px",
        aspectRatio: "1.4 / 1",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box>{day && day.format("DD")}</Box>
    </Grid>
  );
}
