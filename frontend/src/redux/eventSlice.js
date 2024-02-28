import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import serverAPI from "../api/serverAPI";
import { selectUserDetails, selectUserCalendar } from "../redux/userSlice";
import { formatISO } from "date-fns";

/**
 * eventSlice contains all user state for local application
 * events, and functions to set or remove those from the store.
 *
 * TODO:
 * Tests
 * Handle user feedback for all errors
 */

const initialState = {
  eventList: [],
  currentEvent: null,
  showLocalEvents: true,
  loading: false,
  error: null,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    resetEvents: () => initialState,
    setCurrentEvent(state, action) {
      const { id, source } = action.payload;
      state.currentEvent = { id, source };
    },
    resetCurrentEvent(state) {
      state.currentEvent = null;
    },
    toggleLocalEventsVisibility(state) {
      state.showLocalEvents = !state.showLocalEvents;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventsByCalendar.fulfilled, (state, action) => {
        state.eventList = action.payload;
      })
      .addCase(fetchEventsByCalendar.rejected, (state, action) => {
        state.error = action.error.message || action.payload;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.currentEvent = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.error = action.error.message || action.payload;
      })
      .addCase(removeEvent.fulfilled, (state, action) => {
        state.currentEvent = action.payload;
      })
      .addCase(removeEvent.rejected, (state, action) => {
        state.error = action.error.message || action.payload;
      })
      .addCase(resetState, () => initialState)
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/fulfilled") ||
          action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        }
      );
  },
});

export const fetchEventsByCalendar = createAsyncThunk(
  "events/fetchEventsByCalendar",
  async (calendar_id, { rejectWithValue }) => {
    try {
      const response = await serverAPI.fetchEventsByCalendar(calendar_id);
      return response;
    } catch (err) {
      return rejectWithValue(err.response.data.error || err.message);
    }
  }
);

export const createEvent = createAsyncThunk(
  /**
   * Creates a local application event with eventData
   * Uses getState to access user details which are used
   * to format the eventData for the request
   *
   * dispatches action to fetch events for an updated list
   */
  "events/createEvent",
  async (eventData, { rejectWithValue, dispatch, getState }) => {
    try {
      const userDetails = selectUserDetails(getState());
      const userCalendar = selectUserCalendar(getState());
      const formattedEventData = {
        ...eventData,
        calendar_id: userCalendar.id,
        title: eventData.title,
        start_time: formatISO(new Date(eventData.start_time)),
        end_time: formatISO(new Date(eventData.end_time)),
        owner_id: userDetails.id,
        time_zone: userDetails.time_zone,
      };
      await serverAPI.createEvent(formattedEventData);
      dispatch(fetchEventsByCalendar(userCalendar.id));
    } catch (err) {
      return rejectWithValue(err.response.data.error || err.message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  /**
   * updates a local event by id with eventData
   *
   * returns the updated {event obj}
   */
  "events/updateEvent",
  async ({ id, eventData }, { rejectWithValue }) => {
    try {
      const response = await serverAPI.updateEvent(id, eventData);
      return response;
    } catch (err) {
      return rejectWithValue(err.response.data.error || err.message);
    }
  }
);

export const removeEvent = createAsyncThunk(
  /**
   * removes a local event by id
   * 
   * returns { message: "Event deleted" }
   */
  "events/removeEvent",
  async (id, { rejectWithValue }) => {
    try {
      const response = await serverAPI.removeEvent(id);
      return response;
    } catch (err) {
      return rejectWithValue(err.response.data.error || err.message);
    }
  }
);

export const selectCurrentEvent = (state) => {
  if (state.events.currentEvent) {
    return state.events.eventList.find(
      (event) => event.id === state.events.currentEvent.id
    );
  }
};

export const {
  resetEvents,
  setCurrentEvent,
  resetCurrentEvent,
  toggleLocalEventsVisibility,
} = eventSlice.actions;
export const selectEvents = (state) => state.events.eventList;
export const selectShowLocalEvents = (state) => state.events.showLocalEvents;
export default eventSlice.reducer;
