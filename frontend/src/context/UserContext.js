import React, { createContext, useState, useContext, useEffect } from "react";
import ServerApi from "../api/serverApi";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext({
  user: null,
  setUser: () => {},
});

const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("socialCalToken");
    if (storedToken) {
      ServerApi.token = storedToken;
      const decoded = jwtDecode(storedToken);

      if (decoded) {
        setUser({ id: decoded.id });
      }
    }
  }, []);

  useEffect(() => {
    // Fetch user details when user is available
    if (user) {
      async function fetchUserData() {
        try {
          console.log(user);
          const response = await ServerApi.fetchUserDetails(user.id);
          console.log(response);
          setUserDetails(response);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      fetchUserData();
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { useUserContext, UserProvider };
