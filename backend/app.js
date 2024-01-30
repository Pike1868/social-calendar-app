"use strict";
const express = require("express");
const cors = require("cors");
const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/localAuth");
const googleAuthRoutes = require("./routes/googleAuth");
const morgan = require("morgan");
const app = express();
const passport = require("passport");

// Initialize Passport
app.use(passport.initialize());
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);
app.use("/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.get("/favicon.ico", (req, res) => res.sendStatus(204));

app.get("/", async (req, res, next) => {
  res.send("App is running...");
});

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
