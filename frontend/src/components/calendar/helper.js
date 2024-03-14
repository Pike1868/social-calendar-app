import dayjs from "dayjs";

const NUM_DAYS_OF_WEEK = 7;
const NUM_WEEKS_PER_MONTH = 6;

function getMonthGrid(date = dayjs()) {
  const firstDayOfMonth = date.startOf("month").startOf("week");

  const daysMatrix = Array.from({ length: NUM_WEEKS_PER_MONTH }, (_, weekIndex) =>
    Array.from({ length: NUM_DAYS_OF_WEEK }, (_, dayIndex) =>
      firstDayOfMonth.add(weekIndex * 7 + dayIndex, "day")
    )
  );

  return daysMatrix;
}

export default getMonthGrid;