"use strict";

// Set valid 32-byte hex key BEFORE any modules load (dotenv won't override existing env vars)
process.env.SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const User = require("../../models/user");
const { createToken } = require("../../helpers/token");
const { encrypt } = require("../../helpers/cryptoHelper");

// Mock the googleFreeBusy service
jest.mock("../../services/googleFreeBusy");
const { fetchFreeBusyForUser } = require("../../services/googleFreeBusy");

let user1Token, user2Token, user3Token, user4Token;
const user1Id = "freebusy-user1";
const user2Id = "freebusy-user2";
const user3Id = "freebusy-user3";
const user4Id = "freebusy-user4";

const timeMin = "2026-03-10T00:00:00Z";
const timeMax = "2026-03-10T23:59:59Z";

beforeAll(async () => {
  await db.query("DELETE FROM circle_members");
  await db.query("DELETE FROM circles");
  await db.query("DELETE FROM friendships");
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  // User 1: requester, has Google tokens
  await User.register({
    id: user1Id,
    email: "fb1@test.com",
    password: "password1",
    first_name: "Alice",
    last_name: "FB",
  });
  const encAccess1 = encrypt("fake-access-token-1");
  const encRefresh1 = encrypt("fake-refresh-token-1");
  await db.query(
    `UPDATE users SET access_token = $1, refresh_token = $2, sharing_opt_in = true WHERE id = $3`,
    [encAccess1, encRefresh1, user1Id]
  );

  // User 2: friend with Google tokens, opted IN
  await User.register({
    id: user2Id,
    email: "fb2@test.com",
    password: "password2",
    first_name: "Bob",
    last_name: "FB",
  });
  const encAccess2 = encrypt("fake-access-token-2");
  const encRefresh2 = encrypt("fake-refresh-token-2");
  await db.query(
    `UPDATE users SET access_token = $1, refresh_token = $2, sharing_opt_in = true WHERE id = $3`,
    [encAccess2, encRefresh2, user2Id]
  );

  // User 3: friend with Google tokens, NOT opted in
  await User.register({
    id: user3Id,
    email: "fb3@test.com",
    password: "password3",
    first_name: "Carol",
    last_name: "FB",
  });
  const encAccess3 = encrypt("fake-access-token-3");
  const encRefresh3 = encrypt("fake-refresh-token-3");
  await db.query(
    `UPDATE users SET access_token = $1, refresh_token = $2, sharing_opt_in = false WHERE id = $3`,
    [encAccess3, encRefresh3, user3Id]
  );

  // User 4: no Google tokens, opted in
  await User.register({
    id: user4Id,
    email: "fb4@test.com",
    password: "password4",
    first_name: "Dave",
    last_name: "FB",
  });
  await db.query(
    `UPDATE users SET sharing_opt_in = true WHERE id = $1`,
    [user4Id]
  );

  // Create accepted friendships: user1 <-> user2, user1 <-> user3, user1 <-> user4
  await db.query(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'accepted')`,
    [user1Id, user2Id]
  );
  await db.query(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'accepted')`,
    [user1Id, user3Id]
  );
  await db.query(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'accepted')`,
    [user1Id, user4Id]
  );

  user1Token = createToken({ id: user1Id });
  user2Token = createToken({ id: user2Id });
  user3Token = createToken({ id: user3Id });
  user4Token = createToken({ id: user4Id });
});

beforeEach(async () => {
  await db.query("BEGIN");
  jest.clearAllMocks();
});
afterEach(async () => { await db.query("ROLLBACK"); });
afterAll(async () => { await db.end(); });

describe("GET /freebusy", () => {
  test("returns busy blocks for an opted-in friend", async () => {
    const mockBusy = [
      { start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" },
      { start: "2026-03-10T14:00:00Z", end: "2026-03-10T15:30:00Z" },
    ];
    fetchFreeBusyForUser.mockResolvedValue(mockBusy);

    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user2Id]).toEqual({ busy: mockBusy });
    expect(fetchFreeBusyForUser).toHaveBeenCalledTimes(1);
  });

  test("returns error for friend who has not opted in", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user3Id}&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user3Id]).toEqual({
      error: "User has not opted in to sharing",
    });
    expect(fetchFreeBusyForUser).not.toHaveBeenCalled();
  });

  test("returns error for friend with no Google tokens", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user4Id}&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user4Id]).toEqual({
      error: "User has no Google Calendar connected",
    });
  });

  test("returns error for non-friend user ID", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=nonexistent-user&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results["nonexistent-user"]).toEqual({
      error: "Not an accepted friend",
    });
  });

  test("handles multiple friend IDs with mixed results", async () => {
    const mockBusy = [
      { start: "2026-03-10T09:00:00Z", end: "2026-03-10T10:00:00Z" },
    ];
    fetchFreeBusyForUser.mockResolvedValue(mockBusy);

    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id},${user3Id},nonexistent&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user2Id]).toEqual({ busy: mockBusy });
    expect(resp.body.results[user3Id]).toEqual({ error: "User has not opted in to sharing" });
    expect(resp.body.results["nonexistent"]).toEqual({ error: "Not an accepted friend" });
  });

  test("handles Google API failure gracefully", async () => {
    fetchFreeBusyForUser.mockRejectedValue(new Error("Google API error"));

    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user2Id]).toEqual({
      error: "Unable to fetch availability",
    });
  });

  test("401 if not logged in", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=${timeMin}&timeMax=${timeMax}`);
    expect(resp.statusCode).toBe(401);
  });

  test("400 if missing friendIds", async () => {
    const resp = await request(app)
      .get(`/freebusy?timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("400 if missing timeMin", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("400 if missing timeMax", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=${timeMin}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("400 if timeMax before timeMin", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=${timeMax}&timeMax=${timeMin}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("400 if invalid date format", async () => {
    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=not-a-date&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("400 if too many friend IDs", async () => {
    const manyIds = Array.from({ length: 21 }, (_, i) => `id${i}`).join(",");
    const resp = await request(app)
      .get(`/freebusy?friendIds=${manyIds}&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user1Token}`);
    expect(resp.statusCode).toBe(400);
  });

  test("supports timeZone parameter", async () => {
    const mockBusy = [
      { start: "2026-03-10T09:00:00-05:00", end: "2026-03-10T10:00:00-05:00" },
    ];
    fetchFreeBusyForUser.mockResolvedValue(mockBusy);

    const resp = await request(app)
      .get(`/freebusy?friendIds=${user2Id}&timeMin=${timeMin}&timeMax=${timeMax}&timeZone=America/New_York`)
      .set("authorization", `Bearer ${user1Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user2Id]).toEqual({ busy: mockBusy });
  });

  test("pending friendship does not grant access", async () => {
    await db.query(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending')`,
      [user2Id, user3Id]
    );

    const resp = await request(app)
      .get(`/freebusy?friendIds=${user3Id}&timeMin=${timeMin}&timeMax=${timeMax}`)
      .set("authorization", `Bearer ${user2Token}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.results[user3Id]).toEqual({ error: "Not an accepted friend" });
  });
});
