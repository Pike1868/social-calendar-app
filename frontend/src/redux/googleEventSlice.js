import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import googleCalendarAPI from "../api/googleCalendarAPI";
import {
  filterEventsByTimeRange,
  normalizeGoogleEventStructure,
  revertGoogleEventStructure,
} from "./helpers/googleEventsHelper";
import { selectUserDetails, selectUserCalendar } from "../redux/userSlice";
import { createEvent, removeEvent, updateEvent } from "./eventSlice";
import dayjs from "dayjs";
import serverAPI from "../api/serverAPI";

/**
 *
 * googleEventSlice contains all user state for google calendar events,
 * and functions to set or remove those from the store.
 *
 *
 * TODO:
 * Tests
 * Handle user feedback for all errors
 *
 */

const initialState = {
  events: [],
  currentGoogleEvent: null,
  showGoogleEvents: false,
  calendarList: [],
  calendarVisibility: {},
  status: "idle",
  error: null,
};

export const fetchGoogleEvents = createAsyncThunk(
  /**
   * Fetch google events from ALL calendars the user has access to.
   * First fetches the calendar list, then fetches events from each calendar.
   * Tags each event with the source calendar name and color.
   */
  "googleEvents/fetchGoogleEvents",
  async (accessToken, { rejectWithValue }) => {
    try {
      // Set token on the API
      googleCalendarAPI.setAccessToken(accessToken);

      // Fetch all calendars
      let calendars;
      try {
        calendars = await googleCalendarAPI.fetchCalendarList();
      } catch {
        // Fallback to primary only if calendarList fails
        calendars = [{ id: "primary", summary: "Primary", backgroundColor: "#4285f4" }];
      }

      // Fetch events from each calendar in parallel
      const allEvents = [];
      const results = await Promise.allSettled(
        calendars.map(async (cal) => {
          const response = await googleCalendarAPI.request(`${encodeURIComponent(cal.id)}/events`);
          const items = response.items || [];
          return items.map((event) => ({
            ...event,
            _calendarId: cal.id,
            _calendarName: cal.summary || cal.id,
            _calendarColor: cal.backgroundColor || "#4285f4",
          }));
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          allEvents.push(...result.value);
        }
      }

      // Deduplicate events by ID (same event can appear in multiple calendars)
      const seen = new Set();
      const uniqueEvents = allEvents.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      const googleEvents = filterEventsByTimeRange(uniqueEvents).map((e) => ({
        ...normalizeGoogleEventStructure(e),
        calendar_name: e._calendarName,
        calendar_color: e._calendarColor,
        source_calendar_id: e._calendarId,
      }));

      // Return both events and calendar list
      return { events: googleEvents, calendars };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createGoogleEvent = createAsyncThunk(
  /**
   * Creates an event with eventData
   * Uses getState to use the users access token for the request
   *
   * After it is created in google the event is then created locally
   * with data formatted to include calendar_id to link with local calendar
   * and google_id to link with google calendar event.
   */
  "googleEvent/createGoogleEvent",
  async (eventData, { dispatch, getState, rejectWithValue }) => {
    try {
      const userDetails = selectUserDetails(getState());
      const userCalendar = selectUserCalendar(getState());
      googleCalendarAPI.setAccessToken(userDetails.access_token); // Ensure token is set before making a request

      const formattedEventData = revertGoogleEventStructure(eventData);
      const response = await googleCalendarAPI.createGoogleEvent(
        formattedEventData
      );
      dispatch(
        createEvent({
          ...eventData,
          calendar_id: userCalendar.id,
          start_time: dayjs(eventData.start_time).format(),
          end_time: dayjs(eventData.end_time).format(),
          google_id: response.id,
        })
      );

      // Refetch events to update the list
      dispatch(fetchGoogleEvents(userDetails.access_token));
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const removeGoogleEvent = createAsyncThunk(
  /**
   * Removes an event from google
   * then uses the google_id to find the local event id
   * to then use the existing removeEvent action to also delete the event locally
   */
  "googleEvent/removeGoogleEvent",
  async (googleId, { dispatch, getState, rejectWithValue }) => {
    try {
      const userDetails = selectUserDetails(getState());
      await googleCalendarAPI.removeGoogleEvent(googleId);

      // Fetch local event ID by Google ID
      const { id } = await serverAPI.fetchLocalEventIdByGoogleId(googleId);

      await dispatch(removeEvent(id));

      await dispatch(fetchGoogleEvents(userDetails.access_token));
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

export const updateGoogleEvent = createAsyncThunk(
  /**
   * Updates a event from google
   * then uses the google_id to find the local event id
   * to then use the existing updateEvent action to also update the event locally
   */
  "googleEvent/updateGoogleEvent",
  async ({ google_id, eventData }, { dispatch, getState, rejectWithValue }) => {
    try {
      const userDetails = selectUserDetails(getState());
      const userCalendar = selectUserCalendar(getState());
      const formattedEventData = revertGoogleEventStructure(eventData);
      await googleCalendarAPI.updateGoogleEvent(google_id, formattedEventData);
      const { id } = await serverAPI.fetchLocalEventIdByGoogleId(google_id);
      const localFormatEventData = {
        ...eventData,
        calendar_id: userCalendar.id,
      };

      await dispatch(updateEvent({ id, eventData: localFormatEventData }));

      await dispatch(fetchGoogleEvents(userDetails.access_token));
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

const googleEventSlice = createSlice({
  name: "googleEvents",
  initialState,
  reducers: {
    setCurrentGoogleEvent(state, action) {
      state.currentGoogleEvent = {
        id: action.payload.id,
        source: action.payload.source,
      };
    },
    resetCurrentGoogleEvent(state) {
      state.currentGoogleEvent = null;
    },
    toggleGoogleEventsVisibility(state) {
      state.showGoogleEvents = !state.showGoogleEvents;
    },
    toggleCalendarVisibility(state, action) {
      const calendarId = action.payload;
      state.calendarVisibility[calendarId] = !state.calendarVisibility[calendarId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoogleEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGoogleEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.events = action.payload.events;
        state.calendarList = action.payload.calendars.map((cal) => ({
          id: cal.id,
          name: cal.summary || cal.id,
          color: cal.backgroundColor || "#4285f4",
        }));
        // Initialize visibility for new calendars (default visible)
        action.payload.calendars.forEach((cal) => {
          if (state.calendarVisibility[cal.id] === undefined) {
            state.calendarVisibility[cal.id] = true;
          }
        });
      })
      .addCase(fetchGoogleEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createGoogleEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGoogleEvent.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(createGoogleEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateGoogleEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateGoogleEvent.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(updateGoogleEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeGoogleEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeGoogleEvent.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(removeGoogleEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetState, () => initialState);
  },
});

export const selectCurrentGoogleEvent = (state) => {
  const { currentGoogleEvent } = state.googleEvent;
  if (currentGoogleEvent?.id) {
    return state.googleEvent.events.find(
      (event) => event.id === currentGoogleEvent.id
    );
  }
};

export default googleEventSlice.reducer;
export const {
  setCurrentGoogleEvent,
  resetCurrentGoogleEvent,
  toggleGoogleEventsVisibility,
  toggleCalendarVisibility,
} = googleEventSlice.actions;

export const selectAllGoogleEvents = (state) => state.googleEvent.events;
export const selectShowGoogleEvents = (state) =>
  state.googleEvent.showGoogleEvents;
export const selectCalendarList = (state) => state.googleEvent.calendarList;
export const selectCalendarVisibility = (state) =>
  state.googleEvent.calendarVisibility;
export const selectVisibleGoogleEvents = createSelector(
  [(state) => state.googleEvent.events, (state) => state.googleEvent.calendarVisibility],
  (events, calendarVisibility) =>
    events.filter((e) => {
      const calId = e.source_calendar_id || "primary";
      return calendarVisibility[calId] !== false;
    })
);
