"use strict";

require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY;

const PORT = process.env.PORT;

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  if (process.env.NODE_ENV === "test") {
    return process.env.DB_URI_TEST;
  } else if (process.env.NODE_ENV === "dev") {
    return process.env.DB_URI_DEV;
  } else {
    return process.env.DB_URI_PROD;
  }
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;
console.log("------------------");
console.log("App Config:".green);
console.log("PORT:".yellow, PORT.toString());
console.log("Database:".yellow, getDatabaseUri());
console.log("------------------");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
