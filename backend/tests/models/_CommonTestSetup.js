const db = require("../../db");
const dayjs = require("dayjs");

const testEventIds = [];
const testCalendarIds = [];

async function commonBeforeAll() {
  //Clear any existing test data
  await db.query("DELETE FROM events");
  await db.query("DELETE FROM calendars");
  await db.query("DELETE FROM users");

  //Insert test users
  await db.query(`
        INSERT INTO users (id, email, password)
        VALUES ('testUser1', 'testuser1@test.com', 'testpassword1'),
               ('testUser2', 'testuser2@test.com', 'testpassword2')`);

  // Insert test calendars and save their IDs
  const calendarResults = await db.query(`
  INSERT INTO calendars (id, user_id, title, location, time_zone)
  VALUES ('c1', 'testUser1', 'Test Calendar 1','Test Location', 'EST' ),
         ('c2', 'testUser1', 'Test Calendar 2','Test Location', 'EST' ),
         ('c3', 'testUser2', 'Test Calendar 3','Test Location', 'EST')
  RETURNING id`);
  testCalendarIds.splice(0, 0, ...calendarResults.rows.map((r) => r.id));

  // Insert test events and save their IDs
  const eventResults = await db.query(
    `
  INSERT INTO events (id, calendar_id, title, start_time, end_time)
  VALUES ('e1', 'c1', 'Event 1', $1, $2),
         ('e2', 'c1', 'Event 2', $3, $4)
  RETURNING id`,
    [
      dayjs().add(1, "day").toDate(),
      dayjs().add(1, "day").add(1, "hour").toDate(),
      dayjs().add(2, "days").toDate(),
      dayjs().add(2, "days").add(1, "hour").toDate(),
    ]
  );
  testEventIds.splice(0, 0, ...eventResults.rows.map((r) => r.id));
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

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testEventIds,
  testCalendarIds,
};
