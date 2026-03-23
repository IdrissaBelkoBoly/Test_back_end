// src/auth/AuthContext.js
import { createContext, useState, useEffect , useContext } from "react";

  export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [profileVersion, setProfileVersion]= useState(0);
  const [refreshArticles, setRefreshArticles] = useState(0);

  useEffect(() => {
    if (token) {
      // Tu peux aussi stocker l’utilisateur dans le localStorage si tu veux
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) setUser(storedUser);
    }
  }, [token]);

 /* const login = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };*/
  const login = (userData, token) => {
    const fullUser = { ...userData, token }; // ajoute le token dans l'objet user
    setUser(fullUser);
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(fullUser));
  };
  

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout , setUser ,profileVersion,setProfileVersion,refreshArticles,setRefreshArticles}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
