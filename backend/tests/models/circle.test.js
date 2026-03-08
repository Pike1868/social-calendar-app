"use strict";

const db = require("../../db");
const Circle = require("../../models/circle");
const Friendship = require("../../models/friendship");
const User = require("../../models/user");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../../expressError");

let user1Id, user2Id, user3Id;

async function setupUsers() {
  await db.query("DELETE FROM circle_members");
  await db.query("DELETE FROM circles");
  await db.query("DELETE FROM friendships");
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  const u1 = await User.register({
    id: "circleUser1",
    email: "circle1@test.com",
    password: "password1",
    first_name: "Alice",
    last_name: "Smith",
  });
  user1Id = u1.id;

  const u2 = await User.register({
    id: "circleUser2",
    email: "circle2@test.com",
    password: "password2",
    first_name: "Bob",
    last_name: "Jones",
  });
  user2Id = u2.id;

  const u3 = await User.register({
    id: "circleUser3",
    email: "circle3@test.com",
    password: "password3",
    first_name: "Carol",
    last_name: "Davis",
  });
  user3Id = u3.id;

  // Create friendships: user1 <-> user2, user1 <-> user3
  const f1 = await db.query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'accepted') RETURNING id`,
    [user1Id, user2Id]
  );
  const f2 = await db.query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'accepted') RETURNING id`,
    [user1Id, user3Id]
  );
}

beforeAll(setupUsers);
beforeEach(async () => { await db.query("BEGIN"); });
afterEach(async () => { await db.query("ROLLBACK"); });
afterAll(async () => { await db.end(); });

describe("Circle.create", () => {
  test("creates a circle", async () => {
    const c = await Circle.create(user1Id, "Close Friends");
    expect(c).toEqual(expect.objectContaining({
      id: expect.any(Number),
      user_id: user1Id,
      name: "Close Friends",
    }));
  });
});

describe("Circle.listByUser", () => {
  test("lists circles with members", async () => {
    const c = await Circle.create(user1Id, "Family");
    await Circle.addMember(c.id, user2Id, user1Id);

    const circles = await Circle.listByUser(user1Id);
    expect(circles).toHaveLength(1);
    expect(circles[0].name).toBe("Family");
    expect(circles[0].members).toHaveLength(1);
    expect(circles[0].members[0].user_id).toBe(user2Id);
  });

  test("returns empty array if no circles", async () => {
    const circles = await Circle.listByUser(user2Id);
    expect(circles).toEqual([]);
  });
});

describe("Circle.get", () => {
  test("gets a circle by id", async () => {
    const c = await Circle.create(user1Id, "Work");
    const fetched = await Circle.get(c.id, user1Id);
    expect(fetched.name).toBe("Work");
  });

  test("throws ForbiddenError for non-owner", async () => {
    const c = await Circle.create(user1Id, "Work");
    await expect(Circle.get(c.id, user2Id)).rejects.toThrow(ForbiddenError);
  });

  test("throws NotFoundError for missing circle", async () => {
    await expect(Circle.get(99999, user1Id)).rejects.toThrow(NotFoundError);
  });
});

describe("Circle.addMember", () => {
  test("adds a friend to circle", async () => {
    const c = await Circle.create(user1Id, "Buddies");
    const m = await Circle.addMember(c.id, user2Id, user1Id);
    expect(m).toEqual(expect.objectContaining({
      circle_id: c.id,
      member_id: user2Id,
    }));
  });

  test("throws BadRequestError for non-friend", async () => {
    const c = await Circle.create(user2Id, "My Circle");
    // user2 and user3 are not friends
    await expect(
      Circle.addMember(c.id, user3Id, user2Id)
    ).rejects.toThrow(BadRequestError);
  });

  test("throws BadRequestError for duplicate member", async () => {
    const c = await Circle.create(user1Id, "Dupes");
    await Circle.addMember(c.id, user2Id, user1Id);
    await expect(
      Circle.addMember(c.id, user2Id, user1Id)
    ).rejects.toThrow(BadRequestError);
  });

  test("throws ForbiddenError for non-owner", async () => {
    const c = await Circle.create(user1Id, "Mine");
    await expect(
      Circle.addMember(c.id, user3Id, user2Id)
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("Circle.removeMember", () => {
  test("removes a member from circle", async () => {
    const c = await Circle.create(user1Id, "Temp");
    await Circle.addMember(c.id, user2Id, user1Id);
    const result = await Circle.removeMember(c.id, user2Id, user1Id);
    expect(result).toEqual({ circle_id: c.id, member_id: user2Id });
  });

  test("throws NotFoundError for non-member", async () => {
    const c = await Circle.create(user1Id, "Temp");
    await expect(
      Circle.removeMember(c.id, user2Id, user1Id)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Circle.remove", () => {
  test("deletes a circle", async () => {
    const c = await Circle.create(user1Id, "Delete Me");
    const result = await Circle.remove(c.id, user1Id);
    expect(result.id).toBe(c.id);
    await expect(Circle.get(c.id, user1Id)).rejects.toThrow(NotFoundError);
  });

  test("throws ForbiddenError for non-owner", async () => {
    const c = await Circle.create(user1Id, "Not Yours");
    await expect(Circle.remove(c.id, user2Id)).rejects.toThrow(ForbiddenError);
  });
});
