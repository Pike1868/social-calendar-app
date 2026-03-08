import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import eventReducer from "./eventSlice";
import googleEventReducer from "./googleEventSlice";
import friendReducer from "./friendSlice";
import freeBusyReducer from "./freeBusySlice";

export default configureStore({
  reducer: {
    user: userReducer,
    events: eventReducer,
    googleEvent: googleEventReducer,
    friends: friendReducer,
    freeBusy: freeBusyReducer,
  },
});
