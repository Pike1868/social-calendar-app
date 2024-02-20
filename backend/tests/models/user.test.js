const User = require("../../models/user");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../../expressError");
const db = require("../../db");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_CommonTestSetup.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("User.authenticate", function () {
  test("works: valid user", async function () {
    const user = await User.authenticate("testuser1@test.com", "testpassword1");
    expect(user).toEqual({
      id: expect.any(String),
      email: "testuser1@test.com",
      first_name: "Test",
      last_name: "User1",
    });
  });

  test("fails: unauthorized for invalid password", async function () {
    try {
      await User.authenticate("testuser1@test.com", "wrong");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

describe("User.register", function () {
  test("works: valid registration", async function () {
    //passing an id here but auto user id generation in the auth routes
    const newUser = await User.register({
      id: "testUser1_ID",
      email: "new@test.com",
      first_name: "New",
      last_name: "User",
      password: "password",
    });
    expect(newUser).toEqual({
      id: expect.any(String),
      email: "new@test.com",
      first_name: "New",
      last_name: "User",
    });
  });

  test("fails: duplicate user", async function () {
    try {
      await User.register({
        email: "testuser1@test.com",
        first_name: "Test",
        last_name: "User",
        password: "password",
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
