import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import getMonthGrid from "./helper";
import Day from "./Day";

function CalendarGrid({ currentDate }) {
  const [monthGrid, setMonthGrid] = useState([]);

  useEffect(() => {
    const grid = getMonthGrid(currentDate);
    setMonthGrid(grid);
  }, [currentDate]);

  console.log(monthGrid[0]);
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
      {monthGrid.map((week, i) =>
        week.map((day, j) => <Day key={`${i}-${j}`} day={day} />)
      )}
    </Box>
  );
}

export default CalendarGrid;
