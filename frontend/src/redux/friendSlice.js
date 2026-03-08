import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { resetState } from "./helpers/globalActions";
import serverAPI from "../api/serverAPI";

// ── Async Thunks ──

export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async (_, { rejectWithValue }) => {
    try {
      return await serverAPI.fetchFriends();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  "friends/fetchFriendRequests",
  async (_, { rejectWithValue }) => {
    try {
      return await serverAPI.fetchFriendRequests();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  "friends/sendFriendRequest",
  async (email, { rejectWithValue }) => {
    try {
      return await serverAPI.sendFriendRequest(email);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  "friends/acceptFriendRequest",
  async (friendshipId, { rejectWithValue }) => {
    try {
      return await serverAPI.acceptFriendRequest(friendshipId);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const declineFriendRequest = createAsyncThunk(
  "friends/declineFriendRequest",
  async (friendshipId, { rejectWithValue }) => {
    try {
      await serverAPI.declineFriendRequest(friendshipId);
      return friendshipId;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const removeFriend = createAsyncThunk(
  "friends/removeFriend",
  async (friendshipId, { rejectWithValue }) => {
    try {
      await serverAPI.removeFriend(friendshipId);
      return friendshipId;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchCircles = createAsyncThunk(
  "friends/fetchCircles",
  async (_, { rejectWithValue }) => {
    try {
      return await serverAPI.fetchCircles();
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const createCircle = createAsyncThunk(
  "friends/createCircle",
  async (name, { rejectWithValue }) => {
    try {
      return await serverAPI.createCircle(name);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deleteCircle = createAsyncThunk(
  "friends/deleteCircle",
  async (circleId, { rejectWithValue }) => {
    try {
      await serverAPI.deleteCircle(circleId);
      return circleId;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const addCircleMember = createAsyncThunk(
  "friends/addCircleMember",
  async ({ circleId, userId }, { rejectWithValue }) => {
    try {
      const member = await serverAPI.addCircleMember(circleId, userId);
      return { circleId, member };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const removeCircleMember = createAsyncThunk(
  "friends/removeCircleMember",
  async ({ circleId, userId }, { rejectWithValue }) => {
    try {
      await serverAPI.removeCircleMember(circleId, userId);
      return { circleId, userId };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

// ── Slice ──

const initialState = {
  friends: [],
  requests: [],
  circles: [],
  loading: false,
  requestsLoading: false,
  circlesLoading: false,
  error: null,
};

const friendSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    clearFriendError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFriends
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload;
        state.loading = false;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchFriendRequests
      .addCase(fetchFriendRequests.pending, (state) => {
        state.requestsLoading = true;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
        state.requestsLoading = false;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.error = action.payload;
      })

      // sendFriendRequest
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.error = action.payload;
      })

      // acceptFriendRequest — move from requests to friends
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const accepted = action.payload;
        state.requests = state.requests.filter(
          (r) => r.friendship_id !== accepted.id
        );
        // Re-fetch friends list will be triggered by the component
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.error = action.payload;
      })

      // declineFriendRequest
      .addCase(declineFriendRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter(
          (r) => r.friendship_id !== action.payload
        );
      })
      .addCase(declineFriendRequest.rejected, (state, action) => {
        state.error = action.payload;
      })

      // removeFriend
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(
          (f) => f.friendship_id !== action.payload
        );
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.error = action.payload;
      })

      // fetchCircles
      .addCase(fetchCircles.pending, (state) => {
        state.circlesLoading = true;
      })
      .addCase(fetchCircles.fulfilled, (state, action) => {
        state.circles = action.payload;
        state.circlesLoading = false;
      })
      .addCase(fetchCircles.rejected, (state, action) => {
        state.circlesLoading = false;
        state.error = action.payload;
      })

      // createCircle
      .addCase(createCircle.fulfilled, (state, action) => {
        state.circles.push({ ...action.payload, members: [] });
      })
      .addCase(createCircle.rejected, (state, action) => {
        state.error = action.payload;
      })

      // deleteCircle
      .addCase(deleteCircle.fulfilled, (state, action) => {
        state.circles = state.circles.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCircle.rejected, (state, action) => {
        state.error = action.payload;
      })

      // addCircleMember — re-fetch circles for updated member list
      .addCase(addCircleMember.rejected, (state, action) => {
        state.error = action.payload;
      })

      // removeCircleMember
      .addCase(removeCircleMember.fulfilled, (state, action) => {
        const { circleId, userId } = action.payload;
        const circle = state.circles.find((c) => c.id === circleId);
        if (circle) {
          circle.members = circle.members.filter((m) => m.user_id !== userId);
        }
      })
      .addCase(removeCircleMember.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Global reset
      .addCase(resetState, () => initialState);
  },
});

export const { clearFriendError } = friendSlice.actions;

export const selectFriends = (state) => state.friends.friends;
export const selectFriendRequests = (state) => state.friends.requests;
export const selectCircles = (state) => state.friends.circles;
export const selectFriendsLoading = (state) => state.friends.loading;
export const selectRequestsLoading = (state) => state.friends.requestsLoading;
export const selectCirclesLoading = (state) => state.friends.circlesLoading;
export const selectFriendError = (state) => state.friends.error;

export default friendSlice.reducer;
