import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import eventReducer from "./eventSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    events: eventReducer,
  },
});
