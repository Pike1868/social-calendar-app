import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ServerApi from "../api/serverApi";

const initialState = {
  events: [],
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventsByCalendar.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEventsByCalendar.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEventsByCalendar.rejected, (state, action) => {
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
export const { resetEvents } = eventSlice.actions;
export const selectEvents = (state) => state.events.events;
export default eventSlice.reducer;
