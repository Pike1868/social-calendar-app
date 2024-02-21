import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ServerApi from "../api/serverApi";

const initialState = {
  eventList: [],
  currentEventId: null,
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
    setCurrentEventId(state, action) {
      state.currentEventId = action.payload;
    },
    resetCurrentEventId(state) {
      state.currentEventId = null;
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
      const response = await ServerApi.fetchEventsByCalendar(calendar_id);
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
      await ServerApi.createEvent(eventData);
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
      const response = await ServerApi.updateEvent(id, eventData);
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
      console.log("serveApi.removeEvent:id", id);
      const response = await ServerApi.removeEvent(id);
      return response;
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

export const selectCurrentEvent = (state) => {
  if (state.events.currentEventId) {
    return state.events.eventList.find(
      (event) => event.id === state.events.currentEventId
    );
  } else {
    console.log("No currentEventId in store");
  }
};

export const { resetEvents, setCurrentEventId, resetCurrentEventId } =
  eventSlice.actions;
export const selectEvents = (state) => state.events.eventList;
export default eventSlice.reducer;
