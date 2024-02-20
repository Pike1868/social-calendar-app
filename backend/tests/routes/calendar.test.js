const request = require("supertest");
const app = require("../../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testCalendarIds,
} = require("./_CommonTestSetup");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET /calendar/:calendar_id", function () {
  test("works: successfully fetches a calendar by ID", async function () {
    const response = await request(app).get(`/calendar/${testCalendarIds[0]}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      calendar: {
        id: testCalendarIds[0],
        title: "Test's Calendar",
        user_id: "testUser1_ID",
        location: null,
        time_zone: null,
        google_id: null,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });
  });

  test("fails: Not found for non-existent calendar ID", async function () {
    const response = await request(app).get(`/calendars/nonexistentID`);
    expect(response.statusCode).toBe(404);
  });
});
