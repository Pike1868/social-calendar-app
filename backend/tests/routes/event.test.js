const request = require("supertest");
const app = require("../../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUser1Token,
  testCalendarIds,
} = require("./_CommonTestSetup");
const { BadRequestError } = require("../../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /events/create", function () {
  test("works: successfully creates an event", async function () {
    const resp = await request(app)
      .post("/event/create")
      .send({
        title: "Test Event",
        owner_id: "testUser1_ID",
        description: "This is a test event",
        start_time: "2023-01-01T22:00:00Z",
        end_time: "2023-01-01T23:00:00Z",
        calendar_id: testCalendarIds[0],
      })
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      event: {
        id: expect.any(String),
        title: "Test Event",
        description: "This is a test event",
        start_time: expect.any(String),
        end_time: expect.any(String),
        owner_id: "testUser1_ID",
        calendar_id: testCalendarIds[0],
        color_id: null,
        location: null,
        status: null,
        time_zone: null,
        google_id: null,
      },
    });
  });

  test("fails: throws error for invalid data", async function () {
    const resp = await request(app)
      .post("/event/create")
      .send({
        title: "Incorrect Calendar",
        description: "Missing title",
        startDateTime: "2023-01-01T10:00:00Z",
        endDateTime: "2023-01-01T12:00:00Z",
        calendar_id: "doesn't_exist",
      })
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(resp.statusCode).toBe(400);
  });

  test("fails: without required title field", async function () {
    const resp = await request(app)
      .post("/event/create")
      .send({
        description: "Missing title",
        startDateTime: "2023-01-01T10:00:00Z",
        endDateTime: "2023-01-01T12:00:00Z",
        calendar_id: testCalendarIds[0],
      })
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(resp.statusCode).toBe(400);
  });
  test("unauthorized: no user token", async function () {
    const resp = await request(app)
      .post("/event/create")
      .send({
        description: "Missing title",
        startDateTime: "2023-01-01T10:00:00Z",
        endDateTime: "2023-01-01T12:00:00Z",
        calendar_id: testCalendarIds[0],
      })
      .set("authorization", `Bearer notAToken`);

    expect(resp.statusCode).toBe(401);
  });
});
