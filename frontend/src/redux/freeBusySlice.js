import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import serverAPI from "../api/serverAPI";

// ── Async Thunks ──

export const fetchFreeBusy = createAsyncThunk(
  "freeBusy/fetchFreeBusy",
  async ({ friendIds, timeMin, timeMax }, { rejectWithValue }) => {
    try {
      const availability = await serverAPI.fetchFreeBusy({
        friendIds,
        timeMin,
        timeMax,
      });
      return availability;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

// ── Slice ──

const initialState = {
  // { [friendId]: { busy: [{start, end}], displayName } | { error } }
  availability: {},
  loading: false,
  error: null,
};

const freeBusySlice = createSlice({
  name: "freeBusy",
  initialState,
  reducers: {
    clearFreeBusy: () => initialState,
    clearFreeBusyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFreeBusy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFreeBusy.fulfilled, (state, action) => {
        state.availability = action.payload;
        state.loading = false;
      })
      .addCase(fetchFreeBusy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetState, () => initialState);
  },
});

export const { clearFreeBusy, clearFreeBusyError } = freeBusySlice.actions;

export const selectFreeBusyAvailability = (state) =>
  state.freeBusy.availability;
export const selectFreeBusyLoading = (state) => state.freeBusy.loading;
export const selectFreeBusyError = (state) => state.freeBusy.error;

export default freeBusySlice.reducer;
