"use strict";

const db = require("../../db.js");
const { NotFoundError } = require("../../expressError.js");
const Calendar = require("../../models/calendar.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testCalendarIds,
} = require("./_CommonTestSetup.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/******************************* create */
describe("create", () => {
  test("works: creates a calendar", async function () {
    const newCalendar = await Calendar.create({
      id: "testCalendar",
      user_id: "testUser1",
      title: "Test Calendar",
      location: "Test Location",
      time_zone: "UTC",
    });

    expect(newCalendar).toEqual({
      id: "testCalendar",
      user_id: "testUser1",
      title: "Test Calendar",
      location: "Test Location",
      time_zone: "UTC",
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });

    const found = await db.query(
      "SELECT * FROM calendars WHERE id = 'testCalendar'"
    );
    expect(found.rows.length).toEqual(1);
  });
});

/*******************************  findAll*/
describe("findAll", function () {
  test("works: finds all calendars for test user", async function () {
    const calendars = await Calendar.findAll("testUser1");
    expect(calendars).toEqual([
      {
        id: "c1",
        user_id: "testUser1",
        title: "Test Calendar 1",
        location: "Test Location",
        time_zone: "EST",
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        google_id: null,
      },
      {
        id: "c2",
        user_id: "testUser1",
        title: "Test Calendar 2",
        location: "Test Location",
        time_zone: "EST",
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        google_id: null,
      },
    ]);
  });

  test("not found error if no such user_id", async function () {
    try {
      await Calendar.findAll("nope");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", () => {
  test("works: gets calendar by id", async function () {
    const calendar = await Calendar.getCalendar(testCalendarIds[0]);
    expect(calendar).toEqual({
      id: testCalendarIds[0],
      user_id: "testUser1",
      title: "Test Calendar 1",
      location: "Test Location",
      time_zone: "EST",
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
      google_id: null,
    });
  });
  test("not found error if no such calendar", async function () {
    try {
      await Calendar.getCalendar("nope");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", () => {
  test("works: updates calendar by id", async function () {
    const calendar = await Calendar.update(testCalendarIds[0], {
      title: "Updated Calendar Test",
      location: "Mars",
    });

    expect(calendar).toEqual({
      id: testCalendarIds[0],
      user_id: "testUser1",
      title: "Updated Calendar Test",
      location: "Mars",
      time_zone: "EST",
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });
  test("not found error if no such calendar", async function () {
    try {
      await Calendar.update("nope", {
        title: "Update Calendar Not Found Test",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
/************************************** remove */

describe("remove", () => {
  test("works: removes a calendar by id", async function () {
    // Check count of calendars table
    const res = await db.query(`SELECT COUNT(*) FROM calendars`);
    const initialCount = parseInt(res.rows[0].count);

    // Call remove to delete a calendar by id
    await Calendar.remove(testCalendarIds[0]);

    // Check count of calendars table after remove
    const result = await db.query(`SELECT COUNT(*) FROM calendars`);
    const newCount = parseInt(result.rows[0].count);

    // Expect count to have decreased by 1
    expect(newCount).toBe(initialCount - 1);
  });

  test("not found error if no such calendar", async function () {
    try {
      await Calendar.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
