import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import socket from "../socket";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();

  const [notifCount, setNotifCount] = useState(0);

  // 🔥 SOCKET TEMPS RÉEL
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join", user._id);

    socket.on("newNotification", () => {
      setNotifCount((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifCount, setNotifCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
