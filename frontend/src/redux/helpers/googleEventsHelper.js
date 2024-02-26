import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

// set local timezone from browser, or default
const userTimeZone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

// Convert ISO strings to Date objects
export const filterEventsByTimeRange = (events) => {
  const now = new Date();
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const oneYearFromNow = new Date(now.setFullYear(now.getFullYear() + 2)); // +2 because we already subtracted a year

  return events.filter((event) => {
    const eventStartTime = new Date(event.start.dateTime || event.start.date); // Adjust based on the actual event date format
    return eventStartTime >= oneYearAgo && eventStartTime <= oneYearFromNow;
  });
};

export const normalizeGoogleEventStructure = (googleEvent) => {
  return {
    id: googleEvent.id, // Google Event ID
    calendar_id: "primary",
    owner_id: "",
    title: googleEvent.summary || "",
    location: googleEvent.location || "",
    description: googleEvent.description || "",
    start_time: googleEvent.start.dateTime || googleEvent.start.date,
    end_time: googleEvent.end.dateTime || googleEvent.end.date,
    status: googleEvent.status || "",
    color_id: "",
  };
};

export const revertGoogleEventStructure = (localEvent) => {
  const startDateTime = parseISO(localEvent.start_time);
  const endDateTime = parseISO(localEvent.end_time);
  // Format dates with timezone offset
  const formattedStartDateTime = format(
    startDateTime,
    "yyyy-MM-dd'T'HH:mm:ssXXX",
    { userTimeZone }
  );
  const formattedEndDateTime = format(endDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX", {
    userTimeZone,
  });
  return {
    summary: localEvent.title,
    start: {
      dateTime: formattedStartDateTime,
      timeZone: userTimeZone,
    },
    end: {
      dateTime: formattedEndDateTime,
      timeZone: userTimeZone,
    },
    location: localEvent.location,
    description: localEvent.description,
  };
};
