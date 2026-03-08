"use strict";

const db = require("../db");
const User = require("../models/user");
const Friendship = require("../models/friendship");
const Suggestion = require("../models/suggestion");
const { fetchFreeBusyForUser } = require("./googleFreeBusy");
const { discoverEvents } = require("./eventDiscovery");

/**
 * Smart Suggestions Engine
 *
 * Generates personalized suggestions for a user based on:
 *   - Availability matching with friends
 *   - Reconnect nudges for circles with stale interactions
 *   - Event discovery paired with friend availability
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Format a Date to a human-readable day and time range string.
 * e.g. "Monday 2:00 PM - 4:00 PM"
 */
function formatTimeRange(start, end) {
  const dayName = start.toLocaleDateString("en-US", { weekday: "long" });
  const startTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dayName} ${startTime} - ${endTime}`;
}

/**
 * Find mutual free windows between two sets of busy blocks within a time range.
 * Returns arrays of { start, end } representing free windows > 1 hour.
 */
function findMutualFreeWindows(busyA, busyB, rangeStart, rangeEnd) {
  // Merge all busy blocks into a single sorted list
  const allBusy = [...busyA, ...busyB]
    .map(b => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }))
    .sort((a, b) => a.start - b.start);

  // Merge overlapping busy blocks
  const merged = [];
  for (const block of allBusy) {
    if (merged.length > 0 && block.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, block.end);
    } else {
      merged.push({ ...block });
    }
  }

  // Find free windows between merged busy blocks
  const freeWindows = [];
  let cursor = rangeStart.getTime();

  for (const block of merged) {
    if (block.start > cursor) {
      const gapMs = block.start - cursor;
      if (gapMs >= ONE_HOUR_MS) {
        freeWindows.push({
          start: new Date(cursor),
          end: new Date(block.start),
        });
      }
    }
    cursor = Math.max(cursor, block.end);
  }

  // Check trailing free window
  const rangeEndMs = rangeEnd.getTime();
  if (rangeEndMs > cursor && (rangeEndMs - cursor) >= ONE_HOUR_MS) {
    freeWindows.push({
      start: new Date(cursor),
      end: new Date(rangeEndMs),
    });
  }

  return freeWindows;
}

/**
 * Generate availability-match suggestions.
 * Finds mutual free windows between user and each friend over the next 7 days.
 */
async function generateAvailabilitySuggestions(userId, userData) {
  const suggestions = [];

  try {
    const friends = await Friendship.listFriends(userId);
    if (friends.length === 0) return suggestions;

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + SEVEN_DAYS_MS).toISOString();
    const timeZone = userData.time_zone || "UTC";

    // Fetch user's own busy blocks
    if (!userData.access_token) return suggestions;

    let userBusy;
    try {
      userBusy = await fetchFreeBusyForUser(userData, timeMin, timeMax, timeZone);
    } catch (err) {
      console.warn(`SuggestionEngine: Could not fetch FreeBusy for user ${userId}:`, err.message);
      return suggestions;
    }

    // Check each friend (limit to first 10 to avoid excessive API calls)
    const friendsToCheck = friends.slice(0, 10);

    for (const friend of friendsToCheck) {
      try {
        const friendData = await User.findById(friend.user_id);

        if (!friendData.sharing_opt_in || !friendData.access_token) continue;

        const friendBusy = await fetchFreeBusyForUser(
          friendData,
          timeMin,
          timeMax,
          friendData.time_zone || "UTC"
        );

        const freeWindows = findMutualFreeWindows(
          userBusy,
          friendBusy,
          now,
          new Date(now.getTime() + SEVEN_DAYS_MS)
        );

        if (freeWindows.length > 0) {
          // Use the first free window for the suggestion
          const window = freeWindows[0];
          const friendName = friendData.display_name || friendData.first_name || "a friend";
          const timeRange = formatTimeRange(window.start, window.end);

          suggestions.push({
            user_id: userId,
            type: "availability_match",
            title: `You and ${friendName} are both free ${timeRange}`,
            body: `You have ${freeWindows.length} overlapping free window${freeWindows.length > 1 ? "s" : ""} this week.`,
            metadata: {
              friend_id: friend.user_id,
              friend_name: friendName,
              free_windows: freeWindows.map(w => ({
                start: w.start.toISOString(),
                end: w.end.toISOString(),
              })),
            },
            expires_at: timeMax,
          });
        }
      } catch (err) {
        console.warn(`SuggestionEngine: Availability check failed for friend ${friend.user_id}:`, err.message);
      }
    }
  } catch (err) {
    console.warn("SuggestionEngine: Availability suggestions failed:", err.message);
  }

  return suggestions;
}

/**
 * Generate reconnect nudge suggestions.
 * Checks each circle for the last interaction timestamp; if > 6 weeks, nudges.
 */
async function generateReconnectSuggestions(userId) {
  const suggestions = [];

  try {
    // Get user's circles with members and last event interaction
    const circlesRes = await db.query(
      `SELECT c.id, c.name, c.created_at,
              MAX(e.start_time) AS last_interaction
       FROM circles c
       LEFT JOIN circle_members cm ON cm.circle_id = c.id
       LEFT JOIN events e ON e.owner_id = cm.member_id
         AND (e.owner_id = $1 OR EXISTS (
           SELECT 1 FROM friendships f
           WHERE f.status = 'accepted'
             AND ((f.requester_id = $1 AND f.addressee_id = cm.member_id)
               OR (f.addressee_id = $1 AND f.requester_id = cm.member_id))
         ))
       WHERE c.user_id = $1
       GROUP BY c.id, c.name, c.created_at`,
      [userId]
    );

    const now = new Date();

    for (const circle of circlesRes.rows) {
      const lastInteraction = circle.last_interaction
        ? new Date(circle.last_interaction)
        : new Date(circle.created_at);

      const timeSince = now.getTime() - lastInteraction.getTime();

      if (timeSince > SIX_WEEKS_MS) {
        suggestions.push({
          user_id: userId,
          type: "reconnect_nudge",
          title: `It's been a while since you've connected with ${circle.name}`,
          body: "Consider reaching out or planning something together.",
          metadata: {
            circle_id: circle.id,
            circle_name: circle.name,
            last_interaction: lastInteraction.toISOString(),
          },
        });
      }
    }
  } catch (err) {
    console.warn("SuggestionEngine: Reconnect suggestions failed:", err.message);
  }

  return suggestions;
}

/**
 * Generate event-discovery suggestions.
 * For user's city, find nearby events. If a friend is in the same city and both
 * are free during the event, create a suggestion.
 */
async function generateEventSuggestions(userId, userData) {
  const suggestions = [];

  try {
    const city = userData.home_city;
    if (!city) return suggestions;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const events = await discoverEvents(city, today);

    if (events.length === 0) return suggestions;

    const friends = await Friendship.listFriends(userId);
    const sameCityFriends = [];

    for (const friend of friends) {
      try {
        const friendData = await User.findById(friend.user_id);
        if (friendData.home_city && friendData.home_city.toLowerCase() === city.toLowerCase()) {
          sameCityFriends.push({ ...friend, userData: friendData });
        }
      } catch (err) {
        console.warn(`SuggestionEngine: Could not load friend ${friend.user_id}:`, err.message);
      }
    }

    // For each event with a start time, check if user and a same-city friend are both free
    for (const event of events.slice(0, 10)) {
      if (!event.start_time) continue;

      const eventStart = new Date(event.start_time);
      const eventEnd = event.end_time ? new Date(event.end_time) : new Date(eventStart.getTime() + 2 * ONE_HOUR_MS);
      const eventDay = eventStart.toLocaleDateString("en-US", { weekday: "long" });

      // Try to find a friend who's also free during this event
      for (const friend of sameCityFriends) {
        const friendName = friend.userData.display_name || friend.userData.first_name || "a friend";

        try {
          if (!userData.access_token || !friend.userData.access_token || !friend.userData.sharing_opt_in) {
            continue;
          }

          const timeMin = eventStart.toISOString();
          const timeMax = eventEnd.toISOString();

          const [userBusy, friendBusy] = await Promise.all([
            fetchFreeBusyForUser(userData, timeMin, timeMax, userData.time_zone || "UTC"),
            fetchFreeBusyForUser(friend.userData, timeMin, timeMax, friend.userData.time_zone || "UTC"),
          ]);

          // If neither has busy blocks during this time, both are free
          if (userBusy.length === 0 && friendBusy.length === 0) {
            suggestions.push({
              user_id: userId,
              type: "event_discovery",
              title: `There's a ${event.title} near you and ${friendName} this ${eventDay}`,
              body: event.venue ? `At ${event.venue}` : null,
              metadata: {
                event_id: event.id,
                event_title: event.title,
                event_url: event.url,
                event_start: event.start_time,
                event_end: event.end_time,
                venue: event.venue,
                friend_id: friend.user_id,
                friend_name: friendName,
              },
              expires_at: eventEnd.toISOString(),
            });
            // Only one friend suggestion per event
            break;
          }
        } catch (err) {
          console.warn(`SuggestionEngine: Event availability check failed:`, err.message);
        }
      }
    }
  } catch (err) {
    console.warn("SuggestionEngine: Event suggestions failed:", err.message);
  }

  return suggestions;
}

/**
 * Main entry point: generate all suggestion types for a user.
 *
 * @param {string} userId - The user ID to generate suggestions for.
 * @returns {Promise<Array>} - Array of created suggestion records.
 */
async function generateForUser(userId) {
  const userData = await User.findById(userId);
  const created = [];

  // Clean up expired suggestions first
  try {
    await Suggestion.deleteExpired();
  } catch (err) {
    console.warn("SuggestionEngine: Failed to clean expired suggestions:", err.message);
  }

  // Generate all suggestion types in parallel, each handles its own errors
  const [availabilitySuggestions, reconnectSuggestions, eventSuggestions] = await Promise.allSettled([
    generateAvailabilitySuggestions(userId, userData),
    generateReconnectSuggestions(userId),
    generateEventSuggestions(userId, userData),
  ]);

  // Collect results from settled promises
  const allSuggestions = [];

  if (availabilitySuggestions.status === "fulfilled") {
    allSuggestions.push(...availabilitySuggestions.value);
  } else {
    console.warn("SuggestionEngine: Availability generation rejected:", availabilitySuggestions.reason);
  }

  if (reconnectSuggestions.status === "fulfilled") {
    allSuggestions.push(...reconnectSuggestions.value);
  } else {
    console.warn("SuggestionEngine: Reconnect generation rejected:", reconnectSuggestions.reason);
  }

  if (eventSuggestions.status === "fulfilled") {
    allSuggestions.push(...eventSuggestions.value);
  } else {
    console.warn("SuggestionEngine: Event generation rejected:", eventSuggestions.reason);
  }

  // Persist all suggestions
  for (const suggestion of allSuggestions) {
    try {
      const record = await Suggestion.create(suggestion);
      created.push(record);
    } catch (err) {
      console.warn("SuggestionEngine: Failed to save suggestion:", err.message);
    }
  }

  return created;
}

module.exports = { generateForUser };
