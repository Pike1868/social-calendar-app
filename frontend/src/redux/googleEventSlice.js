import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import googleCalendarAPI from "../api/googleCalendarAPI";
import {
  filterEventsByTimeRange,
  normalizeGoogleEventStructure,
  revertGoogleEventStructure,
} from "./helpers/googleEventsHelper";
import { selectUserDetails } from "../redux/userSlice";

export const fetchGoogleEvents = createAsyncThunk(
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
  "googleEvent/createGoogleEvent",
  async (eventData, { dispatch, getState, rejectWithValue }) => {
    try {
      const userDetails = selectUserDetails(getState()); // Assuming you have a selector to get user details
      googleCalendarAPI.setAccessToken(userDetails.access_token); // Ensure token is set before making a request

      const formattedEventData = revertGoogleEventStructure(eventData);
      console.log(formattedEventData);
      await googleCalendarAPI.createGoogleEvent(formattedEventData);

      // Refetch events to update the list
      dispatch(fetchGoogleEvents(userDetails.access_token));
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const removeGoogleEvent = createAsyncThunk(
  "googleEvent/removeGoogleEvent",
  async (id, { dispatch, getState, rejectWithValue }) => {
    try {
      const userDetails = selectUserDetails(getState());
      await googleCalendarAPI.removeGoogleEvent(id);

      // Refetch events to update the list
      dispatch(fetchGoogleEvents(userDetails.access_token));
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

export const updateGoogleEvent = createAsyncThunk(
  "googleEvent/updateGoogleEvent",
  async ({ id, eventData }, { dispatch, getState, rejectWithValue }) => {
    try {
      console.log(eventData);
      const userDetails = selectUserDetails(getState());
      const formattedEventData = revertGoogleEventStructure(eventData);
      await googleCalendarAPI.updateGoogleEvent(id, formattedEventData);
      // Refetch events to update the list
      dispatch(fetchGoogleEvents(userDetails.access_token));
    } catch (err) {
      return rejectWithValue(err.toString());
    }
  }
);

const googleEventSlice = createSlice({
  name: "googleEvents",
  initialState: {
    events: [],
    currentGoogleEvent: null,
    showGoogleEvents: false,
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
      .addCase(removeGoogleEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeGoogleEvent.fulfilled, (state, action) => {
        state.loading = false;
        // console.log(action.payload);
      })
      .addCase(removeGoogleEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectCurrentGoogleEvent = (state) => {
  const { currentGoogleEvent } = state.googleEvent;
  if (currentGoogleEvent && currentGoogleEvent.id) {
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
