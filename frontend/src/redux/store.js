import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import eventReducer from "./eventSlice";
import googleEventsReducer from "./googleEventSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    events: eventReducer,
    googleEvents: googleEventsReducer,
  },
});
