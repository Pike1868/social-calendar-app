"use strict";

const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const User = require("../../models/user");
const { createToken } = require("../../helpers/token");

let user1Token, user2Token;
let user1Id = "circleRouteUser1";
let user2Id = "circleRouteUser2";
let user3Id = "circleRouteUser3";

beforeAll(async () => {
  await db.query("DELETE FROM circle_members");
  await db.query("DELETE FROM circles");
  await db.query("DELETE FROM friendships");
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  await User.register({
    id: user1Id,
    email: "croute1@test.com",
    password: "password1",
    first_name: "Alice",
    last_name: "Smith",
  });
  await User.register({
    id: user2Id,
    email: "croute2@test.com",
    password: "password2",
    first_name: "Bob",
    last_name: "Jones",
  });
  await User.register({
    id: user3Id,
    email: "croute3@test.com",
    password: "password3",
    first_name: "Carol",
    last_name: "Davis",
  });

  // Create accepted friendship: user1 <-> user2
  await db.query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'accepted')`,
    [user1Id, user2Id]
  );

  user1Token = createToken({ id: user1Id });
  user2Token = createToken({ id: user2Id });
});

beforeEach(async () => { await db.query("BEGIN"); });
afterEach(async () => { await db.query("ROLLBACK"); });
afterAll(async () => { await db.end(); });

describe("POST /circles", () => {
  test("creates a circle", async () => {
    const resp = await request(app)
      .post("/circles")
      .send({ name: "Family" })
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body.circle).toEqual(expect.objectContaining({
      id: expect.any(Number),
      user_id: user1Id,
      name: "Family",
    }));
  });

  test("400 with invalid body", async () => {
    const resp = await request(app)
      .post("/circles")
      .send({})
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("401 if not logged in", async () => {
    const resp = await request(app)
      .post("/circles")
      .send({ name: "Family" });
    expect(resp.statusCode).toBe(401);
  });
});

describe("GET /circles", () => {
  test("lists user circles with members", async () => {
    // Create a circle and add a member
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Buddies" })
      .set("authorization", `Bearer ${user1Token}`);
    const circleId = createResp.body.circle.id;

    await request(app)
      .post(`/circles/${circleId}/members`)
      .send({ user_id: user2Id })
      .set("authorization", `Bearer ${user1Token}`);

    const resp = await request(app)
      .get("/circles")
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.circles).toHaveLength(1);
    expect(resp.body.circles[0].members).toHaveLength(1);
    expect(resp.body.circles[0].members[0].user_id).toBe(user2Id);
  });
});

describe("POST /circles/:id/members", () => {
  test("adds a friend to circle", async () => {
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Work" })
      .set("authorization", `Bearer ${user1Token}`);
    const circleId = createResp.body.circle.id;

    const resp = await request(app)
      .post(`/circles/${circleId}/members`)
      .send({ user_id: user2Id })
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body.member).toEqual(expect.objectContaining({
      circle_id: circleId,
      member_id: user2Id,
    }));
  });

  test("400 for non-friend", async () => {
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Test" })
      .set("authorization", `Bearer ${user1Token}`);
    const circleId = createResp.body.circle.id;

    const resp = await request(app)
      .post(`/circles/${circleId}/members`)
      .send({ user_id: user3Id })
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("400 with invalid body", async () => {
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Test" })
      .set("authorization", `Bearer ${user1Token}`);

    const resp = await request(app)
      .post(`/circles/${createResp.body.circle.id}/members`)
      .send({})
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });
});

describe("DELETE /circles/:id/members/:userId", () => {
  test("removes a member from circle", async () => {
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Temp" })
      .set("authorization", `Bearer ${user1Token}`);
    const circleId = createResp.body.circle.id;

    await request(app)
      .post(`/circles/${circleId}/members`)
      .send({ user_id: user2Id })
      .set("authorization", `Bearer ${user1Token}`);

    const resp = await request(app)
      .delete(`/circles/${circleId}/members/${user2Id}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe("Member removed from circle");
  });
});

describe("DELETE /circles/:id", () => {
  test("deletes a circle", async () => {
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Delete Me" })
      .set("authorization", `Bearer ${user1Token}`);
    const circleId = createResp.body.circle.id;

    const resp = await request(app)
      .delete(`/circles/${circleId}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe("Circle deleted");
  });

  test("403 for non-owner", async () => {
    const createResp = await request(app)
      .post("/circles")
      .send({ name: "Not Yours" })
      .set("authorization", `Bearer ${user1Token}`);
    const circleId = createResp.body.circle.id;

    const resp = await request(app)
      .delete(`/circles/${circleId}`)
      .set("authorization", `Bearer ${user2Token}`);
    expect(resp.statusCode).toBe(403);
  });
});
