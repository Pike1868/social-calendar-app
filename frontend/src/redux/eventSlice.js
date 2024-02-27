import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import serverAPI from "../api/serverAPI";
import { selectUserDetails, selectUserCalendar } from "../redux/userSlice";
import { formatISO } from "date-fns";

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
    resetEvents(state) {
      Object.assign(state, initialState);
    },
    setCurrentEvent(state, action) {
      state.currentEvent = {
        id: action.payload.id,
        source: action.payload.source,
      };
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
      .addCase(fetchEventsByCalendar.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEventsByCalendar.fulfilled, (state, action) => {
        state.loading = false;
        state.eventList = action.payload;
      })
      .addCase(fetchEventsByCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.event = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.event = action.payload;
      })
      .addCase(removeEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetState, () => initialState);
  },
});

export const fetchEventsByCalendar = createAsyncThunk(
  "events/fetchEventsByCalendar",
  async (calendar_id, { rejectWithValue }) => {
    try {
      const response = await serverAPI.fetchEventsByCalendar(calendar_id);
      return response;
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

export const createEvent = createAsyncThunk(
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
      return rejectWithValue(err.toString());
    }
  }
);

export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async ({ id, eventData }, { rejectWithValue }) => {
    try {
      const response = await serverAPI.updateEvent(id, eventData);
      return response;
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

export const removeEvent = createAsyncThunk(
  "events/removeEvent",
  async (id, { rejectWithValue }) => {
    try {
      const response = await serverAPI.removeEvent(id);
      return response;
    } catch (err) {
      return rejectWithValue(err.toString());
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
