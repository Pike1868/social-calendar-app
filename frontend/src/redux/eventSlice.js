import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import serverAPI from "../api/serverAPI";

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
      console.log(state.showLocalEvents, "What does the state look like?")
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
      });
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
  async (eventData, { rejectWithValue, dispatch }) => {
    try {
      await serverAPI.createEvent(eventData);
      dispatch(fetchEventsByCalendar(eventData.calendar_id));
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
