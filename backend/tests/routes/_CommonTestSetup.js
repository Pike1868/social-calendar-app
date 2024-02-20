"use strict";

const db = require("../../db.js");
const User = require("../../models/user.js");
const { createToken } = require("../../helpers/token.js");
const Calendar = require("../../models/calendar.js");

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
      first_name: "Test",
      last_name: "User1",
    },
  ];

  //Register test users and create default calendar
  for (let testUser of testUsers) {
    await User.register(testUser);
    const newCalendar = await Calendar.create({
      id: `${testUser.first_name}_default_calendar`,
      user_id: testUser.id,
      title: `${testUser.first_name}'s Calendar`,
    });
    testCalendarIds.push(newCalendar.id);
  }
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
