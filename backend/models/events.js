"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlPartialUpdate");

/**Related functions for Events */

class Event{
      /** Create an event (from data), update db, return new event data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   **/
}