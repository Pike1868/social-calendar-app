import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import serverAPI from "../api/serverAPI";
import { decodeToken } from "./helpers/decodeTokenHelper";
import googleCalendarAPI from "../api/googleCalendarAPI";

/**
 * userSlice contains all user state needed for
 * calendars and events, and functions to
 * set or remove those from the store.
 *
 * TODO:
 * Tests
 * Check proper error handling of expired tokens
 * Handle user feedback for all errors
 */

const setUserIdFromLocalStorage = () => {
  /** Check for a token in local storage
   * Decode to get the user id to rehydrate user state
   * Handle invalid or expired tokens
   */
  const token = localStorage.getItem("socialCalToken");
  if (!token) {
    return null;
  }
  try {
    const decoded = decodeToken(token);
    if (decoded && decoded.id) {
      return { id: decoded.id };
    } else {
      localStorage.removeItem("socialCalToken");
      return null;
    }
  } catch (err) {
    console.error("Token is invalid or expired: ", err);
    localStorage.removeItem("socialCalToken");
    return null;
  }
};

const initialState = {
  user: setUserIdFromLocalStorage(),
  userDetails: null,
  userCalendar: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
    },
    setUserDefaultCalendar: (state, action) => {
      state.userCalendar = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.userDetails = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserCalendars.fulfilled, (state, action) => {
        state.userCalendar = action.payload.calendars[0];
        state.loading = false;
      })
      .addCase(fetchUserCalendars.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(resetState, () => initialState)
      .addMatcher(
        (action) => action.type.endsWith("./pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      );
  },
});

export const registerUser = createAsyncThunk(
  /**
   * Registers user with signup user data
   * Receives token as a response.
   * Decodes token to set Users state
   */
  "user/registerUser",
  async (newUser, { rejectWithValue }) => {
    try {
      const token = await serverAPI.register(newUser);
      const decoded = decodeToken(token);
      return { id: decoded.id }; //payload for fulfilled action
    } catch (err) {
      console.log(err);
      console.error("Error registering user:", err);
      return rejectWithValue(err); //payload for rejected action
    }
  }
);

export const loginUser = createAsyncThunk(
  /**
   * Login user with credentials
   * Receives token as a response.
   * Decodes token to set users state
   */
  "user/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const token = await serverAPI.login(email, password);
      const decoded = decodeToken(token);
      return { id: decoded.id };
    } catch (err) {
      console.error("Error logging in:", err);
      return rejectWithValue(err);
    }
  }
);

export const fetchUserDetails = createAsyncThunk(
  /**
   *  Fetch user details by id
   *  save to userDetails state
   */
  "user/fetchUserDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await serverAPI.fetchUserDetails(userId);
      googleCalendarAPI.setAccessToken(response.access_token);
      return response;
    } catch (err) {
      console.error("Error fetching user data:", err);
      return rejectWithValue(err);
    }
  }
);

export const fetchUserCalendars = createAsyncThunk(
  /**
   * Fetch user's calendars by user id
   * save to userCalendar state
   */
  "user/fetchUserCalendars",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await serverAPI.fetchUserCalendars(userId);
      return response;
    } catch (err) {
      console.error("Error fetching user calendars:", err);
      return rejectWithValue(err);
    }
  }
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      const response = await serverAPI.updateUser({ id: user.id, ...userData });
      return response;
    } catch (err) {
      console.error("Error updating user:", err);
      return rejectWithValue(err);
    }
  }
);

export const { setUser, setUserDetails, setError } = userSlice.actions;
export const selectUser = (state) => state.user;
export const selectUserDetails = (state) => state.user.userDetails;
export const selectUserCalendar = (state) => state.user.userCalendar;
export const selectUserError = (state) => state.user.error;
export default userSlice.reducer;
