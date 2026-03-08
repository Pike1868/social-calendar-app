"use strict";
const { Pool } = require("pg");
const { getDatabaseUri } = require("./config");

const db = new Pool({
  connectionString: getDatabaseUri(),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
  max: process.env.VERCEL ? 3 : 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

module.exports = db;
