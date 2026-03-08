import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import eventReducer from "./eventSlice";
import googleEventReducer from "./googleEventSlice";
import friendReducer from "./friendSlice";
import freeBusyReducer from "./freeBusySlice";
import suggestionReducer from "./suggestionSlice";
import notificationReducer from "./notificationSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    events: eventReducer,
    googleEvent: googleEventReducer,
    friends: friendReducer,
    freeBusy: freeBusyReducer,
    suggestions: suggestionReducer,
    notifications: notificationReducer,
  },
});
