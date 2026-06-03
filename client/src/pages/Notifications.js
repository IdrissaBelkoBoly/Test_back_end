import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Notifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // 🔥 Charger notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (token) fetchNotifications();
  }, [token]);

  // 🔥 Socket temps réel
  useEffect(() => {
    if (!user) return;

    socket.emit("join", user.id);

    socket.on("newNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.off("newNotification");
    };
  }, [user]);

  const getIcon = (type) => {
    switch (type) {
      case "message":
        return "💬";
      case "like":
        return "❤️";
      case "comment":
        return "💭";
      case "reply":
        return "↩️";
      case "purchase":
        return "🛒";
      default:
        return "🔔";
    }
  };

  // 🔥 Marquer comme lu + redirection
  const handleClick = async (notif) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notif._id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔥 REDIRECTION SELON TYPE
      switch (notif.type) {
        case "message":
          navigate(`/messages/${notif.sender._id}`);
          break;
        case "like":
        case "comment":
        case "reply":
          navigate(`/article/${notif.articleId}`);
          break;
        case "purchase":
          navigate(`/profile`);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notifications">
      <h2>🔔 Notifications</h2>

      {notifications.length === 0 ? (
        <p>Aucune notification</p>
      ) : (
        <div className="notification-list">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification ${notif.read ? "read" : "unread"}`}
              onClick={() => handleClick(notif)}
            >
                   
              <span>{getIcon(notif.type)}</span>

              <p>{notif.message}</p>
              <small>{new Date(notif.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
