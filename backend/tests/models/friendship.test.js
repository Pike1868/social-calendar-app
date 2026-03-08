"use strict";

const db = require("../../db");
const Friendship = require("../../models/friendship");
const User = require("../../models/user");
const { NotFoundError, BadRequestError } = require("../../expressError");

let user1Id, user2Id, user3Id;

async function setupUsers() {
  await db.query("DELETE FROM circle_members");
  await db.query("DELETE FROM circles");
  await db.query("DELETE FROM friendships");
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  const u1 = await User.register({
    id: "friendUser1",
    email: "friend1@test.com",
    password: "password1",
    first_name: "Alice",
    last_name: "Smith",
  });
  user1Id = u1.id;

  const u2 = await User.register({
    id: "friendUser2",
    email: "friend2@test.com",
    password: "password2",
    first_name: "Bob",
    last_name: "Jones",
  });
  user2Id = u2.id;

  const u3 = await User.register({
    id: "friendUser3",
    email: "friend3@test.com",
    password: "password3",
    first_name: "Carol",
    last_name: "Davis",
  });
  user3Id = u3.id;
}

beforeAll(setupUsers);
beforeEach(async () => { await db.query("BEGIN"); });
afterEach(async () => { await db.query("ROLLBACK"); });
afterAll(async () => { await db.end(); });

describe("Friendship.sendRequest", () => {
  test("sends a friend request", async () => {
    const f = await Friendship.sendRequest(user1Id, "friend2@test.com");
    expect(f).toEqual(expect.objectContaining({
      id: expect.any(Number),
      requester_id: user1Id,
      addressee_id: user2Id,
      status: "pending",
    }));
  });

  test("throws BadRequestError for self-request", async () => {
    await expect(
      Friendship.sendRequest(user1Id, "friend1@test.com")
    ).rejects.toThrow(BadRequestError);
  });

  test("throws NotFoundError for unknown email", async () => {
    await expect(
      Friendship.sendRequest(user1Id, "nobody@test.com")
    ).rejects.toThrow(NotFoundError);
  });

  test("throws BadRequestError for duplicate request", async () => {
    await Friendship.sendRequest(user1Id, "friend2@test.com");
    await expect(
      Friendship.sendRequest(user1Id, "friend2@test.com")
    ).rejects.toThrow(BadRequestError);
  });

  test("throws BadRequestError for reverse duplicate", async () => {
    await Friendship.sendRequest(user1Id, "friend2@test.com");
    await expect(
      Friendship.sendRequest(user2Id, "friend1@test.com")
    ).rejects.toThrow(BadRequestError);
  });
});

describe("Friendship.accept", () => {
  test("accepts a pending request", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    const f = await Friendship.accept(req.id, user2Id);
    expect(f.status).toBe("accepted");
    expect(f.id).toBe(req.id);
  });

  test("throws NotFoundError if wrong user tries to accept", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    await expect(
      Friendship.accept(req.id, user1Id)
    ).rejects.toThrow(NotFoundError);
  });

  test("throws NotFoundError for non-existent request", async () => {
    await expect(
      Friendship.accept(99999, user2Id)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Friendship.decline", () => {
  test("declines a pending request", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    const result = await Friendship.decline(req.id, user2Id);
    expect(result.id).toBe(req.id);

    // Verify it's deleted
    await expect(Friendship.get(req.id)).rejects.toThrow(NotFoundError);
  });

  test("throws NotFoundError if wrong user tries to decline", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    await expect(
      Friendship.decline(req.id, user1Id)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Friendship.remove", () => {
  test("removes an accepted friendship", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    await Friendship.accept(req.id, user2Id);
    const result = await Friendship.remove(req.id, user1Id);
    expect(result.id).toBe(req.id);
  });

  test("either party can remove", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    await Friendship.accept(req.id, user2Id);
    const result = await Friendship.remove(req.id, user2Id);
    expect(result.id).toBe(req.id);
  });

  test("throws NotFoundError for non-participant", async () => {
    const req = await Friendship.sendRequest(user1Id, "friend2@test.com");
    await expect(
      Friendship.remove(req.id, user3Id)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Friendship.listFriends", () => {
  test("lists accepted friends", async () => {
    const req1 = await Friendship.sendRequest(user1Id, "friend2@test.com");
    await Friendship.accept(req1.id, user2Id);
    const req2 = await Friendship.sendRequest(user3Id, "friend1@test.com");
    await Friendship.accept(req2.id, user1Id);

    const friends = await Friendship.listFriends(user1Id);
    expect(friends).toHaveLength(2);
    expect(friends.map((f) => f.user_id).sort()).toEqual([user2Id, user3Id].sort());
  });

  test("does not list pending requests", async () => {
    await Friendship.sendRequest(user1Id, "friend2@test.com");
    const friends = await Friendship.listFriends(user1Id);
    expect(friends).toHaveLength(0);
  });
});

describe("Friendship.listPendingRequests", () => {
  test("lists incoming pending requests", async () => {
    await Friendship.sendRequest(user1Id, "friend2@test.com");
    await Friendship.sendRequest(user3Id, "friend2@test.com");

    const requests = await Friendship.listPendingRequests(user2Id);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual(expect.objectContaining({
      user_id: expect.any(String),
      email: expect.any(String),
    }));
  });

  test("does not list outgoing requests", async () => {
    await Friendship.sendRequest(user1Id, "friend2@test.com");
    const requests = await Friendship.listPendingRequests(user1Id);
    expect(requests).toHaveLength(0);
  });
});
