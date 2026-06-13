import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../auth/AuthContext";

const CallsPage = () => {
  const { user } = useContext(AuthContext);

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/api/calls/${user._id}`);
        setCalls(res.data || []);
      } catch (err) {
        console.log("ERROR CALLS:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchCalls();
  }, [user]);

  const formatDuration = (seconds = 0) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (call, isCaller) => {
    if (call.status === "rejected") {
      return {
        text: isCaller ? "❌ Appel refusé" : "❌ Vous avez refusé l'appel",
        color: "orange",
      };
    }

    if (call.status === "missed") {
      return {
        text: isCaller ? "📴 Sans réponse" : "📵 Appel manqué",
        color: "red",
      };
    }

    if (call.status === "ended" && call.duration === 0) {
      return {
        text: "📴 Sans réponse",
        color: "red",
      };
    }

    if (call.status === "ended" && call.duration > 0) {
      return {
        text: "✅ Appel terminé",
        color: "green",
      };
    }

    if (call.status === "accepted") {
      return {
        text: "📞 Appel accepté",
        color: "green",
      };
    }

    return {
      text: "📞 Appel",
      color: "blue",
    };
  };

  if (loading) {
    return <h3 style={{ padding: "20px" }}>📞 Chargement...</h3>;
  }


  const deleteCall = async (id) => {
    try {
      await axios.delete(`/api/calls/${id}`);

      setCalls((prev) => prev.filter((call) => call._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h2>📞 Historique des appels</h2>

      {calls.length === 0 ? (
        <p>Aucun appel trouvé</p>
      ) : (
        calls.map((call) => {
          if (!call) return null;

          const isCaller = call?.caller?._id === user._id;
          const otherUser = isCaller ? call?.receiver : call?.caller;

          const status = getStatus(call, isCaller);

          return (
            <div
              key={call._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                borderBottom: "1px solid #eee",
              }}
            >
              {/* LEFT */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <img
                  src={
                    otherUser?.profilePicture
                      ? `http://localhost:5000${otherUser.profilePicture}`
                      : `https://ui-avatars.com/api/?name=${otherUser?.name || "User"}`
                  }
                  alt="avatar"
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                  }}
                />

                <div>
                  <h4 style={{ margin: 0 }}>
                    {call?.type === "video" ? "📹" : "📞"}{" "}
                    {otherUser?.name || "Utilisateur"}
                  </h4>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#888",
                    }}
                  >
                    {isCaller ? "↗ Appel sortant" : "↙ Appel entrant"}
                  </p>

                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                    {formatDate(call?.startedAt)}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: status.color,
                  }}
                >
                  {status.text}
                </p>

                <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                  ⏱ {formatDuration(call?.duration || 0)}
                </p>

                <button
                  onClick={() => deleteCall(call._id)}
                  style={{
                    marginTop: "5px",
                    background: "red",
                    color: "white",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CallsPage;
