"use strict";

const db = require("../../db.js");
const User = require("../../models/user.js");
const { createToken } = require("../../helpers/token.js");

const testEventIds = [];
const testCalendarIds = [];

async function commonBeforeAll() {
  //Clear any existing test data
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  //Insert test users
  const testUsers = [
    {
      id: "testUser1_ID",
      password: "testUser1Password",
      email: "testUser1@test.com",
      firstName: "Test",
      LastName: "User1",
    },
  ];

  await Promise.all(testUsers.map((u) => User.register(u)));
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const testUser1Token = createToken({ id: "testUser1_ID" });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testEventIds,
  testCalendarIds,
  testUser1Token,
};
