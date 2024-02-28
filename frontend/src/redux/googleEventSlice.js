import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import googleCalendarAPI from "../api/googleCalendarAPI";
import {
  filterEventsByTimeRange,
  normalizeGoogleEventStructure,
  revertGoogleEventStructure,
} from "./helpers/googleEventsHelper";
import { selectUserDetails, selectUserCalendar } from "../redux/userSlice";
import { createEvent, removeEvent, updateEvent } from "./eventSlice";
import { formatISO } from "date-fns";
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
  status: "idle",
  error: null,
};

export const fetchGoogleEvents = createAsyncThunk(
  /**
   * Fetch google events with user access token
   * Uses a helper function to modify data structure
   * to match local events for easier integration with UI
   */
  "googleEvents/fetchGoogleEvents",
  async (accessToken, { rejectWithValue }) => {
    try {
      //Pass token to set on api
      const response = await googleCalendarAPI.fetchGoogleEvents(accessToken);
      const googleEvents = filterEventsByTimeRange(response.items).map((e) =>
        normalizeGoogleEventStructure(e)
      );
      return googleEvents;
    } catch (error) {
      return rejectWithValue(error.response.data);
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
          start_time: formatISO(new Date(eventData.start_time)),
          end_time: formatISO(new Date(eventData.end_time)),
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoogleEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGoogleEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.events = action.payload;
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
} = googleEventSlice.actions;

export const selectAllGoogleEvents = (state) => state.googleEvent.events;
export const selectShowGoogleEvents = (state) =>
  state.googleEvent.showGoogleEvents;
