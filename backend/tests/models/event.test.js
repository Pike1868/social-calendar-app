"use strict";

const db = require("../../db.js");
const Event = require("../../models/event.js");
const { NotFoundError } = require("../../expressError");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testEventIds,
} = require("./_CommonTestSetup.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/******************************* create */

describe("create", () => {
  test("works: creates a new event and returns event data", async () => {
    const eventData = {
      calendar_id: "c1",
      owner_id: "testUser1",
      title: "Test Event",
      location: "Test Location",
      description: "Test Description",
      start_time: new Date(),
      end_time: new Date(),
      status: null,
      color_id: "1",
      time_zone: "UTC",
      google_id: null,
    };
    const event = await Event.create(eventData);
    expect(event).toEqual({
      id: expect.any(String),
      owner_id: "testUser1",
      calendar_id: "c1",
      title: "Test Event",
      location: "Test Location",
      description: "Test Description",
      start_time: expect.any(Date),
      end_time: expect.any(Date),
      status: null,
      color_id: "1",
      time_zone: "UTC",
      google_id: null,
    });
  });
});

/*******************************  findAll*/
describe("findAll", function () {
  test("works: finds all events by calendar_id", async function () {
    const events = await Event.findAll("c1");
    expect(events).toEqual([
      {
        id: "e1",
        calendar_id: "c1",
        owner_id: "testUser1",
        title: "Event 1",
        location: null,
        description: null,
        start_time: expect.any(Date),
        end_time: expect.any(Date),
        status: null,
        color_id: null,
        time_zone: null,
        google_id: null,
      },
      {
        id: "e2",
        calendar_id: "c1",
        owner_id: "testUser1",
        title: "Event 2",
        location: null,
        description: null,
        start_time: expect.any(Date),
        end_time: expect.any(Date),
        status: null,
        color_id: null,
        time_zone: null,
        google_id: null,
      },
    ]);
  });

  test("not found error if no such event id", async function () {
    try {
      await Event.findAll("nope");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", () => {
  test("works: gets event by id", async function () {
    const event = await Event.getEvent(testEventIds[0]);
    expect(event).toEqual({
      id: testEventIds[0],
      calendar_id: "c1",
      owner_id: "testUser1",
      title: "Event 1",
      location: null,
      description: null,
      start_time: expect.any(Date),
      end_time: expect.any(Date),
      status: null,
      color_id: null,
      time_zone: null,
      google_id: null,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });
  test("not found error if no such event", async function () {
    try {
      await Event.getEvent("nope");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", () => {
  test("works: updated an event by id", async function () {
    const event = await Event.update(testEventIds[0], {
      title: "Updated Test Event",
    });
    expect(event).toEqual({
      id: testEventIds[0],
      calendar_id: "c1",
      owner_id: "testUser1",
      title: "Updated Test Event",
      location: null,
      description: null,
      start_time: expect.any(Date),
      end_time: expect.any(Date),
      status: null,
      color_id: null,
      time_zone: null,
      google_id: null,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });
  test("not found error if no such event", async function () {
    try {
      await Event.update("nope", {
        title: "Updated Test Event",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", () => {
  test("works: removes event by id", async function () {
    // Check count of events table
    const res = await db.query(`SELECT COUNT(*) FROM events`);
    const initialCount = parseInt(res.rows[0].count);

    // Call remove to delete an event by id
    await Event.remove(testEventIds[0]);

    // Check count of events table after remove
    const result = await db.query(`SELECT COUNT(*) FROM events`);
    const newCount = parseInt(result.rows[0].count);

    // Expect count to have decreased by 1
    expect(newCount).toBe(initialCount - 1);
  });

  test("not found error if no such event", async function () {
    try {
      await Event.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
