import { createContext, useState, useEffect, useContext, useRef } from "react";
import AuthContext from "../auth/AuthContext";
import socket from "../socket";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [currentCallUser, setCurrentCallUser] = useState(null);
  const [callData, setCallData] = useState(null);
  const [usersStatus, setUsersStatus] = useState({});
  const incomingAudioRef = useRef(new Audio("/incoming.mp3"));
  const callingAudioRef = useRef(new Audio("/calling.mp3"));

  useEffect(() => {
    incomingAudioRef.current.loop = true;
    callingAudioRef.current.loop = true;
  }, []);

  // 🔥 JOIN SOCKET
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join", user._id);
  }, [user]);

  // 🔥 RECEIVE CALL
  useEffect(() => {
    const handler = (data) => {
      console.log("📥 CALL REÇU:", data);

      incomingAudioRef.current.play().catch(() => {});

      setIncomingCall(data);
      setCurrentCallUser(data.fromUser || {_id: data.from });
    };

    socket.on("receiveCall", handler);

    return () => socket.off("receiveCall", handler);
  }, []);

  // 🔥 END CALL (important)
  useEffect(() => {
    const endHandler = () => {
      console.log("📴 CALL ENDED GLOBAL");

      stopSounds();

      setIncomingCall(null);
      setCallAccepted(false);
      setCurrentCallUser(null);
      setCallData(null);

      
    };

  

    socket.on("callEnded", endHandler);

    return () => socket.off("callEnded", endHandler);
  }, []);

  // 🔥 ACTIONS
  const acceptCall = () => {

    stopSounds();
    setCallAccepted(true);
    
  };

  const rejectCall = () => {

    stopSounds();
    
    if (incomingCall) {
      socket.emit("endCall", {
        to: incomingCall.from,
      });
    }

    setIncomingCall(null);
    setCallAccepted(false);
    setCurrentCallUser(null);
    setCallData(null);
  };

  const startCallingSound = () => {
    callingAudioRef.current.play().catch(() => {});
  };

  const stopSounds = () => {
    incomingAudioRef.current.pause();
    incomingAudioRef.current.currentTime = 0;

    callingAudioRef.current.pause();
    callingAudioRef.current.currentTime = 0;
  };

  return (
    <CallContext.Provider
      value={{
        socket,
        incomingCall,
        callAccepted,
        currentCallUser,
        setIncomingCall,
        setCallAccepted,
        setCurrentCallUser,
        callData,
        setCallData,
        usersStatus,
        setUsersStatus,
        acceptCall,
        rejectCall,
        startCallingSound,
        stopSounds,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};;

export default CallContext;




import React, { useContext, useEffect } from "react";
import CallContext from "../context/CallContext";

const GlobalCallUI = () => {
  const { incomingCall, acceptCall, rejectCall, callAccepted } =
    useContext(CallContext);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.08);
        }
        100% {
          transform: scale(1);
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!incomingCall || callAccepted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "white",
        }}
      >
        {/* PHOTO */}
        <img
          src={
            incomingCall?.fromUser?.profilePicture
              ? `http://localhost:5000${incomingCall.fromUser.profilePicture}`
              : "/default-avatar.png"
          }
          alt="profile"
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "20px",
            animation: "pulse 1.5s infinite",
            boxShadow: "0 0 30px rgba(0,255,0,0.5)",
          }}
        />

        {/* NAME */}
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          {incomingCall?.fromUser?.name}
        </h1>

        {/* TYPE */}
        <p
          style={{
            fontSize: "20px",
            opacity: 0.8,
            marginBottom: "40px",
          }}
        >
          {incomingCall?.video
            ? "📹 Appel vidéo entrant..."
            : "📞 Appel audio entrant..."}
        </p>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
          }}
        >
          {/* ACCEPT */}
          <button
            onClick={acceptCall}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "none",
              background: "#22c55e",
              color: "white",
              fontSize: "32px",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(34,197,94,0.6)",
            }}
          >
            📞
          </button>

          {/* REJECT */}
          <button
            onClick={rejectCall}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "none",
              background: "#ef4444",
              color: "white",
              fontSize: "32px",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(239,68,68,0.6)",
            }}
          >
            ❌
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalCallUI;






































import React, { useContext, useEffect } from "react";
import CallContext from "../context/CallContext";

const GlobalCallUI = () => {
  const { incomingCall, acceptCall, rejectCall, callAccepted } =
    useContext(CallContext);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.08);
        }
        100% {
          transform: scale(1);
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!incomingCall || callAccepted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "white",
        }}
      >
        {/* PHOTO */}
        <img
          src={
            incomingCall?.fromUser?.profilePicture
              ? `http://localhost:5000${incomingCall.fromUser.profilePicture}`
              : "/default-avatar.png"
          }
          alt="profile"
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "20px",
            animation: "pulse 1.5s infinite",
            boxShadow: "0 0 30px rgba(0,255,0,0.5)",
          }}
        />

        {/* NAME */}
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          {incomingCall?.fromUser?.name}
        </h1>

        {/* TYPE */}
        <p
          style={{
            fontSize: "20px",
            opacity: 0.8,
            marginBottom: "40px",
          }}
        >
          {incomingCall?.video
            ? "📹 Appel vidéo entrant..."
            : "📞 Appel audio entrant..."}
        </p>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
          }}
        >
          {/* ACCEPT */}
          <button
            onClick={acceptCall}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "none",
              background: "#22c55e",
              color: "white",
              fontSize: "32px",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(34,197,94,0.6)",
            }}
          >
            📞
          </button>

          {/* REJECT */}
          <button
            onClick={rejectCall}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "none",
              background: "#ef4444",
              color: "white",
              fontSize: "32px",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(239,68,68,0.6)",
            }}
          >
            ❌
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalCallUI;

