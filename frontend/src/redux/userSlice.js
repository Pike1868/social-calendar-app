import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ServerApi from "../api/serverApi";
import { decodeToken } from "./decodeTokenHelper";

/**
 * TODO:
 * Check proper error handling of expired tokens
 */

const setUserIdFromLocalStorage = () => {
  const token = localStorage.getItem("socialCalToken");
  try {
    const decoded = decodeToken(token);
    return { id: decoded.id };
  } catch (err) {
    console.error("Token is invalid or expired: ", err);
    localStorage.removeItem("socialCalToken");
    return null;
  }
};

const initialState = {
  user: setUserIdFromLocalStorage(),
  userDetails: null,
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
      localStorage.removeItem("socialCalToken");
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
      })

      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setUser, setUserDetails } = userSlice.actions;

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (newUser, { rejectWithValue }) => {
    try {
      const token = await ServerApi.register(newUser);
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
      const token = await ServerApi.login(email, password);
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
      const response = await ServerApi.fetchUserDetails(userId);
      return response;
    } catch (err) {
      console.error("Error fetching user data:", err);
      return rejectWithValue(err);
    }
  }
);

export const selectUser = (state) => state.user;
export default userSlice.reducer;
