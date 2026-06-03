import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useContext } from "react";
import CallContext from "../context/CallContext";


const Navbar = () => {
  const { user,token, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { notifCount } = useNotification();
  const { usersStatus } = useContext(CallContext);
  const { currentCallUser } = useContext(CallContext);
  
  

  if (loading) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* 🏠 LOGO */}
      <h2 className="logo" onClick={() => navigate("/")}>
        MyMarket
      </h2>

      {/* 🔗 MENU PRINCIPAL */}
      <div className="nav-links">
        <Link to="/">Accueil</Link>
        <Link to="/">Produits</Link>

        {token && (
          <>
            <Link to="/create">Ajouter</Link>
            <Link to="/messages">Messages</Link>
            <Link to="/calls">Appels</Link>
            <Link to="/profile">Profil</Link>
          </>
        )}
      </div>

      {/* 🔐 AUTH */}
      <div className="nav-auth">
        {token ? (
          <>
            {/* 👤 Nom utilisateur */}
            <span style={{ marginRight: "10px" }}>{user?.name}</span>
            <span style={{ marginLeft: "10px", fontSize: "12px" }}>
              {currentCallUser && usersStatus?.[currentCallUser._id]
                ? usersStatus[currentCallUser._id].inCall
                  ? "📞 En appel"
                  : usersStatus[currentCallUser._id].online
                    ? "🟢 En ligne"
                    : "⚫ Hors ligne"
                : "—"}
            </span>
            {/* 🔔 Badge notifications */}
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              🔔
              {notifCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-10px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "12px",
                  }}
                >
                  {notifCount}
                </span>
              )}
            </div>

            {/* 🖼️ Avatar simple */}
            <img
              src={
                user?.profilePicture
                  ? `http://localhost:5000${user.profilePicture}`
                  : `https://ui-avatars.com/api/?name=${user?.name || "User"}`
              }
              alt="avatar"
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                marginRight: "10px",
              }}
            />

            <button onClick={handleLogout}>Déconnexion</button>
          </>
        ) : (
          <Link to="/login">Se connecter</Link>
        )}
      </div>
    </nav>
  );
};;

export default Navbar;
