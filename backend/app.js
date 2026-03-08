"use strict";
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");
const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/localAuth");
const googleAuthRoutes = require("./routes/googleAuth");
const tokenRefreshRoutes = require("./routes/tokenRefresh");
const EventRoutes = require("./routes/event");
const UserRoutes = require("./routes/user");
const CalendarRoutes = require("./routes/calendar");
const FriendsRoutes = require("./routes/friends");
const CirclesRoutes = require("./routes/circles");
const FreeBusyRoutes = require("./routes/freebusy");
const discoverRoutes = require("./routes/discover");
const suggestionRoutes = require("./routes/suggestions");
const privacyRoutes = require("./routes/privacy");
const notificationRoutes = require("./routes/notifications");
const inviteRoutes = require("./routes/invites");
const placesRoutes = require("./routes/places");
const app = express();

// Initialize Passport
app.use(passport.initialize());
//Allow requests from front end
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

//Route Prefixes
app.use("/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/auth", tokenRefreshRoutes);
app.use("/user", UserRoutes);
app.use("/event", EventRoutes);
app.use("/calendar", CalendarRoutes);
app.use("/friends", FriendsRoutes);
app.use("/circles", CirclesRoutes);
app.use("/freebusy", FreeBusyRoutes);
app.use("/discover", discoverRoutes);
app.use("/suggestions", suggestionRoutes);
app.use("/privacy", privacyRoutes);
app.use("/notifications", notificationRoutes);
app.use("/invites", inviteRoutes);
app.use("/places", placesRoutes);

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
