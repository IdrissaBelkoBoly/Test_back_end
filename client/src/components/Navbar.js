// components/Navbar.js
import React, { useContext, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../auth/AuthContext";
import NotificationDropdown from "./Notification/NotificationDropdown";
import { io } from "socket.io-client";
import "../App.css";



const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Connexion Socket.io
  useEffect(() => {
    if (!user) return;

    // Connexion au serveur Socket.io
    socketRef.current = io("http://localhost:5000" , {withCredentials: true,});

    // Identification de l'utilisateur côté socket
    socketRef.current.emit("join", user._id);

    // Réception d'une nouvelle notification
    socketRef.current.on("newNotification", () => {
      console.log("🔔 Nouvelle notification reçue !");
      setUnreadCount((prev) => prev + 1); // Incrémentation
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user]);

  // 2. Récupération initiale des notifications non lues
  useEffect(() => {
    if(!user || !user.token) return;
    const fetchUnreadCount = async () => {
      if (!user || !user.token) return;
      try {
        const res = await fetch(
          "http://localhost:5000/api/notifications/unread-count",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error("Erreur chargement notifications:", error);
      }
    };

    fetchUnreadCount();
  }, [user]);

  // 3. Cacher le dropdown si on clique dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Quand le dropdown s'ouvre, remettre le compteur à zéro (notifications vues)
  const handleDropdownToggle = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown && unreadCount > 0) {
      setUnreadCount(0); // Réinitialiser visuellement
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Accueil</Link>
      </div>

      {user ? (
        <div className="nav-right" ref={dropdownRef}>
          <span className="welcome">Bienvenue, {user.name}</span>
          <Link to="/profile">Mon Profil</Link>

          <Link to="/my-transfers" style={{ marginLeft: "10px" }}>
            💰 Mes transferts
          </Link>

          <li>
            <Link to="/confirmations">Confirmations</Link>
          </li>

          {/* Icône Notifications */}
          <button onClick={handleDropdownToggle}>
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {/* Menu Notification */}
          {showDropdown && (
            <div className="notif-dropdown">
              <NotificationDropdown token={user.token} />
            </div>
          )}

          <button onClick={logout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      ) : (
        <div className="nav-auth">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
