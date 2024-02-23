export const filterEventsByTimeRange = (events) => {
  const now = new Date();
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const oneYearFromNow = new Date(now.setFullYear(now.getFullYear() + 2)); // +2 because we already subtracted a year

  return events.filter((event) => {
    const eventStartTime = new Date(event.start.dateTime || event.start.date); // Adjust based on the actual event date format
    return eventStartTime >= oneYearAgo && eventStartTime <= oneYearFromNow;
  });
};

export const normalizeGoogleEvent = (googleEvent) => {
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
