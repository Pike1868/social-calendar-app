import React from "react";
import "./assets/App.css";
import RouteList from "./routes/RouteList";
import NavBar from "./components/NavBar";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <main className="App">
        <NavBar />
        <RouteList />
      </main>
    </UserProvider>
  );
}

export default App;
