"use strict";

const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const User = require("../../models/user");
const { createToken } = require("../../helpers/token");

let user1Token, user2Token, user3Token;
let user1Id = "friendRouteUser1";
let user2Id = "friendRouteUser2";
let user3Id = "friendRouteUser3";

beforeAll(async () => {
  await db.query("DELETE FROM circle_members");
  await db.query("DELETE FROM circles");
  await db.query("DELETE FROM friendships");
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  await User.register({
    id: user1Id,
    email: "froute1@test.com",
    password: "password1",
    first_name: "Alice",
    last_name: "Smith",
  });
  await User.register({
    id: user2Id,
    email: "froute2@test.com",
    password: "password2",
    first_name: "Bob",
    last_name: "Jones",
  });
  await User.register({
    id: user3Id,
    email: "froute3@test.com",
    password: "password3",
    first_name: "Carol",
    last_name: "Davis",
  });

  user1Token = createToken({ id: user1Id });
  user2Token = createToken({ id: user2Id });
  user3Token = createToken({ id: user3Id });
});

beforeEach(async () => { await db.query("BEGIN"); });
afterEach(async () => { await db.query("ROLLBACK"); });
afterAll(async () => { await db.end(); });

describe("POST /friends/request", () => {
  test("sends a friend request", async () => {
    const resp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body.friendship).toEqual(expect.objectContaining({
      requester_id: user1Id,
      addressee_id: user2Id,
      status: "pending",
    }));
  });

  test("401 if not logged in", async () => {
    const resp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" });
    expect(resp.statusCode).toBe(401);
  });

  test("400 with invalid body", async () => {
    const resp = await request(app)
      .post("/friends/request")
      .send({})
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("404 for unknown email", async () => {
    const resp = await request(app)
      .post("/friends/request")
      .send({ email: "nobody@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(404);
  });
});

describe("PATCH /friends/:id/accept", () => {
  test("accepts a friend request", async () => {
    const sendResp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    const fId = sendResp.body.friendship.id;

    const resp = await request(app)
      .patch(`/friends/${fId}/accept`)
      .set("authorization", `Bearer ${user2Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.friendship.status).toBe("accepted");
  });

  test("404 if wrong user tries to accept", async () => {
    const sendResp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    const fId = sendResp.body.friendship.id;

    const resp = await request(app)
      .patch(`/friends/${fId}/accept`)
      .set("authorization", `Bearer ${user3Token}`);
    expect(resp.statusCode).toBe(404);
  });
});

describe("PATCH /friends/:id/decline", () => {
  test("declines a friend request", async () => {
    const sendResp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    const fId = sendResp.body.friendship.id;

    const resp = await request(app)
      .patch(`/friends/${fId}/decline`)
      .set("authorization", `Bearer ${user2Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe("Friend request declined");
  });
});

describe("GET /friends", () => {
  test("lists accepted friends", async () => {
    // Create and accept friendship
    const sendResp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    await request(app)
      .patch(`/friends/${sendResp.body.friendship.id}/accept`)
      .set("authorization", `Bearer ${user2Token}`);

    const resp = await request(app)
      .get("/friends")
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.friends).toHaveLength(1);
    expect(resp.body.friends[0].user_id).toBe(user2Id);
  });

  test("401 if not logged in", async () => {
    const resp = await request(app).get("/friends");
    expect(resp.statusCode).toBe(401);
  });
});

describe("GET /friends/requests", () => {
  test("lists pending incoming requests", async () => {
    await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);

    const resp = await request(app)
      .get("/friends/requests")
      .set("authorization", `Bearer ${user2Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.requests).toHaveLength(1);
  });
});

describe("DELETE /friends/:id", () => {
  test("removes a friendship", async () => {
    const sendResp = await request(app)
      .post("/friends/request")
      .send({ email: "froute2@test.com" })
      .set("authorization", `Bearer ${user1Token}`);
    const fId = sendResp.body.friendship.id;
    await request(app)
      .patch(`/friends/${fId}/accept`)
      .set("authorization", `Bearer ${user2Token}`);

    const resp = await request(app)
      .delete(`/friends/${fId}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe("Friend removed");
  });

  test("401 if not logged in", async () => {
    const resp = await request(app).delete("/friends/1");
    expect(resp.statusCode).toBe(401);
  });
});
