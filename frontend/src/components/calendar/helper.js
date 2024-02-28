import dayjs from "dayjs";

function getMonthGrid(date = dayjs()) {
  const firstDayOfMonth = date.startOf("month").startOf("week");
  const daysInMonth = date.daysInMonth();

  const weeksInMonth = Math.ceil((firstDayOfMonth.date() + daysInMonth) / 7);

  const daysMatrix = Array.from({ length: weeksInMonth }, (_, weekIndex) => {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      return firstDayOfMonth.add(weekIndex * 7 + dayIndex, "day");
    });
  });

  return daysMatrix;
}

export default getMonthGrid;
