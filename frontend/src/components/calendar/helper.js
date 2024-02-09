import dayjs from "dayjs";

const NUM_DAYS_OF_WEEK = 7;
const NUM_WEEKS_PER_MONTH = 5;

function getMonthGrid(date = dayjs()) {
  let daysMatrix = [];
  //Finds the day that first day of the month should be on
  const firstDayOfMonth = date.startOf("month").startOf("week");

  //Builds a matrix of arrays, 6(weeks) x 7(days)
  for (let week = 0; week < NUM_WEEKS_PER_MONTH; week++) {
    let weekDays = [];
    for (let day = 0; day < NUM_DAYS_OF_WEEK; day++) {
      const currentDay = firstDayOfMonth.add(week * 7 + day, "day");
      weekDays.push(currentDay);
    }
    daysMatrix.push(weekDays);
  }

  return daysMatrix;
}

export default getMonthGrid;
