import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ServerApi from "../api/serverApi";
import {
  filterEventsByTimeRange,
  normalizeGoogleEvent,
} from "./helpers/googleEventsHelper";

export const fetchGoogleEvents = createAsyncThunk(
  "googleEvents/fetchGoogleEvents",
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await ServerApi.fetchGoogleEvents(accessToken);
      const googleEvents = filterEventsByTimeRange(response).map((e) =>
        normalizeGoogleEvent(e)
      );
      return googleEvents;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const googleEventsSlice = createSlice({
  name: "googleEvents",
  initialState: {
    events: [],
    currentGoogleEvent: null,
    status: "idle",
    error: null,
  },
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
      });
  },
});

export const selectCurrentGoogleEvent = (state) => {
  const { currentGoogleEvent } = state.googleEvents;
  if (currentGoogleEvent && currentGoogleEvent.id) {
    return state.googleEvents.events.find(
      (event) => event.id === currentGoogleEvent.id
    );
  }
};

export default googleEventsSlice.reducer;
export const { setCurrentGoogleEvent, resetCurrentGoogleEvent } =
  googleEventsSlice.actions;

export const selectAllGoogleEvents = (state) => state.googleEvents.events;
