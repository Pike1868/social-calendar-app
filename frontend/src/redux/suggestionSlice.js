import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import serverAPI from "../api/serverAPI";

// ── Async Thunks ──

export const fetchSuggestions = createAsyncThunk(
  "suggestions/fetchSuggestions",
  async (_, { rejectWithValue }) => {
    try {
      return await serverAPI.fetchSuggestions();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const dismissSuggestion = createAsyncThunk(
  "suggestions/dismissSuggestion",
  async (id, { rejectWithValue }) => {
    try {
      await serverAPI.dismissSuggestion(id);
      return id;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const actOnSuggestion = createAsyncThunk(
  "suggestions/actOnSuggestion",
  async (id, { rejectWithValue }) => {
    try {
      await serverAPI.actOnSuggestion(id);
      return id;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const generateSuggestions = createAsyncThunk(
  "suggestions/generateSuggestions",
  async (_, { rejectWithValue }) => {
    try {
      return await serverAPI.generateSuggestions();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

// ── Slice ──

const initialState = {
  suggestions: [],
  loading: false,
  error: null,
};

const suggestionSlice = createSlice({
  name: "suggestions",
  initialState,
  reducers: {
    clearSuggestionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSuggestions
      .addCase(fetchSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
        state.loading = false;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // dismissSuggestion
      .addCase(dismissSuggestion.fulfilled, (state, action) => {
        state.suggestions = state.suggestions.filter(
          (s) => s.id !== action.payload
        );
      })
      .addCase(dismissSuggestion.rejected, (state, action) => {
        state.error = action.payload;
      })

      // actOnSuggestion
      .addCase(actOnSuggestion.fulfilled, (state, action) => {
        const suggestion = state.suggestions.find(
          (s) => s.id === action.payload
        );
        if (suggestion) {
          suggestion.status = "acted";
        }
      })
      .addCase(actOnSuggestion.rejected, (state, action) => {
        state.error = action.payload;
      })

      // generateSuggestions
      .addCase(generateSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
        state.loading = false;
      })
      .addCase(generateSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Global reset
      .addCase(resetState, () => initialState);
  },
});

export const { clearSuggestionError } = suggestionSlice.actions;

export const selectSuggestions = (state) => state.suggestions.suggestions;
export const selectSuggestionsLoading = (state) => state.suggestions.loading;
export const selectSuggestionError = (state) => state.suggestions.error;

export default suggestionSlice.reducer;
