const Event = require("../../models/events.js");

test("create method creates a new event and returns event data", async () => {
  const eventData = {
    id: "autoGenerated_UUID",
    calendar_id: "testCalendarId",
    title: "Test Event",
    location: "Test Location",
    description: "Test Description",
    start_time: new Date(),
    end_time: new Date(),
    status: "scheduled",
    color_id: "1",
    time_zone: "UTC",
    google_id: null,
  };
  const event = await Event.create(eventData);
  expect(event).toEqual(expect.objectContaining(eventData));
});
