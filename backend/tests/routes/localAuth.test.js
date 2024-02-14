"use strict";

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

const testUser1Data = {
  password: "testUser1Password",
  email: "testUser1@test.com",
};

/************************************** POST /auth/token */
describe("POST /auth/token", () => {
  test("works: for authenticated user", async function () {
    const response = await request(app).post("/auth/token").send(testUser1Data);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      token: expect.any(String),
    });
  });
  test("bad request error: invalid user data", async function () {
    const response = await request(app).post("/auth/token").send({
      username: "shouldBeAnEmail",
      password: "password1",
    });
    expect(response.statusCode).toEqual(400);
  });
  test("unauthorized error: if email doesn't match any users", async function () {
    const response = await request(app).post("/auth/token").send({
      email: "no-such-user",
      password: "password1",
    });
    expect(response.statusCode).toEqual(401);
  });
  test("unauthorized error: wrong password", async function () {
    const response = await request(app).post("/auth/token").send({
      email: "testUser1@test.com",
      password: "password1",
    });
    expect(response.statusCode).toEqual(401);
  });
});

/************************************** POST /auth/register */

describe("POST /auth/register", () => {
  test("works: registers user", async function () {
    const response = await request(app).post("/auth/register").send({
      email: "luisTest@test.com",
      firstName: "Luis",
      lastName: "Test",
      password: "hashed_password",
    });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      token: expect.any(String),
    });
  });

  test("bad request: missing fields", async function () {
    const resp = await request(app).post("/auth/register").send({
      email: "new",
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request: invalid user data", async function () {
    const resp = await request(app).post("/auth/register").send({
      firstName: "first",
      lastName: "last",
      password: "password",
      email: "not-an-email",
    });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request: duplicate email", async function () {
    //Using same email as user created during setup
    const response = await request(app).post("/auth/register").send({
      email: "testUser1@test.com",
      password: "password2",
      firstName: "Test",
      lastName: "User2",
    });
    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual(
      expect.objectContaining({
        message: "Please choose another email",
      })
    );
  });
});
