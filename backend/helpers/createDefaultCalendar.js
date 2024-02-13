const Calendar = require("../models/calendar");
const { v4: uuidv4 } = require("uuid");

/**Create default calendar for new user */

async function createDefaultCalendarForUser(userId, firstName) {
  const calendarId = uuidv4();
  await Calendar.create({
    id: calendarId,
    user_id: userId,
    title: `${firstName}'s Calendar`,
  });
}

module.exports = { createDefaultCalendarForUser };
