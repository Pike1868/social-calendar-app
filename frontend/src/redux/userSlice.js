import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import serverAPI from "../api/serverAPI";
import { decodeToken } from "./helpers/decodeTokenHelper";
import googleCalendarAPI from "../api/googleCalendarAPI";

/**
 * TODO:Check proper error handling of expired tokens
 */

const setUserIdFromLocalStorage = () => {
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
    logoutUser(state) {
      state.user = null;
      state.userDetails = null;
      state.userCalendar = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("socialCalToken");
    },
    setUserDefaultCalendar: (state, action) => {
      state.userCalendar = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload; // Set user ith decoded id
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload; //Gets error info from payload
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.userDetails = action.payload;
        state.loading = false;
      })

      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserCalendars.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserCalendars.fulfilled, (state, action) => {
        state.userCalendar = action.payload.calendars[0];
        state.loading = false;
      })
      .addCase(fetchUserCalendars.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (newUser, { rejectWithValue }) => {
    try {
      const token = await serverAPI.register(newUser);
      const decoded = decodeToken(token);
      return { id: decoded.id }; //payload for fulfilled action
    } catch (err) {
      console.error("Error registering user:", err);
      return rejectWithValue(err); //payload for rejected action
    }
  }
);

export const loginUser = createAsyncThunk(
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

export const { setUser, setUserDetails, logoutUser } = userSlice.actions;
export const selectUser = (state) => state.user;
export const selectUserDetails = (state) => state.user.userDetails;
export const selectUserCalendar = (state) => state.user.userCalendar;
export default userSlice.reducer;
