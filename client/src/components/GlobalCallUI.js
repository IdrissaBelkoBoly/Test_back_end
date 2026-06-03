import React, { useContext } from "react";
import CallContext from "../context/CallContext";

const GlobalCallUI = () => {
  const { incomingCall, acceptCall, rejectCall, callAccepted } =
    useContext(CallContext);

  if (!incomingCall || callAccepted) return null;

  const isVideoCall = incomingCall.video === true;

  return (
    <>
      <style>
        {`
          @keyframes popupFade {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes avatarPulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 rgba(0,255,0,0.5);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 30px rgba(0,255,0,0.8);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 rgba(0,255,0,0.5);
            }
          }

          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            50% { transform: translateX(3px); }
            75% { transform: translateX(-3px); }
            100% { transform: translateX(0); }
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
        }}
      >
        <div
          style={{
            width: "350px",
            background: "#1e1e1e",
            borderRadius: "30px",
            padding: "40px 25px",
            textAlign: "center",
            color: "white",
            animation: "popupFade 0.4s ease",
          }}
        >
          <img
            src={
              incomingCall.fromUser?.profilePicture
                ? `http://localhost:5000${incomingCall.fromUser.profilePicture}`
                : "/default-avatar.png"
            }
            alt="avatar"
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "20px",
              animation: "avatarPulse 1.5s infinite",
            }}
          />

          <h2
            style={{
              fontSize: "28px",
              marginBottom: "10px",
            }}
          >
            {incomingCall.fromUser?.name}
          </h2>

          <p
            style={{
              opacity: 0.7,
              marginBottom: "30px",
              fontSize: "18px",
              animation: "shake 1s infinite",
            }}
          >
            {isVideoCall
              ? "📹 Appel vidéo entrant..."
              : "📞 Appel audio entrant..."}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "30px",
            }}
          >
            <button
              onClick={rejectCall}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "none",
                background: "#ff3b30",
                color: "white",
                fontSize: "32px",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(255,59,48,0.6)",
              }}
            >
              ❌
            </button>

            <button
              onClick={acceptCall}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "none",
                background: "#34c759",
                color: "white",
                fontSize: "32px",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(52,199,89,0.6)",
              }}
            >
              ✅
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalCallUI;
