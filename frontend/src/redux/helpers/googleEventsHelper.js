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
    const eventStartTime = new Date(event.start.dateTime || event.start.date);
    return eventStartTime >= oneYearAgo && eventStartTime <= oneYearFromNow;
  });
};

export const normalizeGoogleEventStructure = (googleEvent) => {
  /* Note: Using the Google event ID as the event's ID (`id`) 
   and also storing it as `google_id`. 
   
   This is done to facilitate easier updates and management of events across both systems.
  */
  return {
    id: googleEvent.id,
    google_id: googleEvent.id,
    calendar_id: "primary",
    title: googleEvent.summary || "",
    location: googleEvent.location || "",
    description: googleEvent.description || "",
    start_time: googleEvent.start.dateTime || googleEvent.start.date,
    end_time: googleEvent.end.dateTime || googleEvent.end.date,
    status: googleEvent.status || "",
  };
};

/**
 * Reverts the structure of a local event object to the Google Calendar event format.
 * Currently, this function statically maps predefined local event properties to their
 * corresponding Google Calendar event fields.
 *
 * TODO: Make this function dynamic, allowing it to adjust the
 * fields to update based on the specific event object passed in.
 */
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
