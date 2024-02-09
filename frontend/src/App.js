import React from "react";
import "./assets/App.css";
import RouteList from "./routes/RouteList";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <main className="App">
        <RouteList />
      </main>
    </UserProvider>
  );
}

export default App;
