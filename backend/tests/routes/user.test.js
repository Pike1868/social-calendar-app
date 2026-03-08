const request = require("supertest");
const app = require("../../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUser1Token,
} = require("./_CommonTestSetup");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET /user/:id", () => {
  test("works: successfully fetches user details", async function () {
    //Using id from test user added in test setup file
    const response = await request(app)
      .get("/user/testUser1_ID")
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      id: "testUser1_ID",
      email: "testUser1@test.com",
      first_name: "Test",
      last_name: "User1",
      display_name: null,
      home_city: null,
      avatar_url: null,
      birthday: null,
      time_zone: null,
      google_id: null,
      access_token: null,
      refresh_token: null,
      onboarding_complete: false,
      sharing_opt_in: false,
      sharing_enabled: true,
    });
  });

  test("fails: Not found error for a non-existent user ID", async function () {
    const resp = await request(app)
      .get(`/user/nonexistentID`)
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(resp.statusCode).toBe(404);
  });
});

describe("GET /user/:id/calendars", function () {
  test("works: successfully fetches all calendars for a user", async function () {
    const response = await request(app)
      .get(`/user/testUser1_ID/calendars`)
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      calendars: expect.any(Array),
    });
  });
  test("fails: Not found error for a non-existent user ID", async function () {
    const response = await request(app)
      .get(`/user/nonexistantID/calendars`)
      .set("authorization", `Bearer ${testUser1Token}`);

    expect(response.statusCode).toBe(404);
  });
  test("fails: Unauthorized if invalid token", async function () {
    const response = await request(app)
      .get(`/user/testUser1_ID/calendars`)
      .set("authorization", `Bearer wrongToken`);

    expect(response.statusCode).toBe(401);
  });
});
