import React, { useEffect } from "react";
import "./assets/App.css";
import RouteList from "./routes/RouteList";
import { useDispatch } from "react-redux";
import { rehydrateUserFromToken } from "./redux/userSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(rehydrateUserFromToken());
  }, [dispatch]);
  return (
    <main className="App">
      <RouteList />
    </main>
  );
}

export default App;
