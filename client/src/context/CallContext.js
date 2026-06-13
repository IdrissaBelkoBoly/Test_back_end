import { createContext, useState, useEffect, useContext, useRef } from "react";
import AuthContext from "../auth/AuthContext";
import socket from "../socket";
import axios from "axios";

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
       console.log("CALL ID REÇU =", data.callId);

      incomingAudioRef.current.play().catch(() => {});

      setIncomingCall(data);
      setCurrentCallUser(data.fromUser || { _id: data.from });
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

  const rejectCall = async () => {
    stopSounds();

    if (incomingCall) {
      socket.emit("endCall", {
        to: incomingCall.from,
      });
           // ✅ ICI TU AJOUTES L’HISTORIQUE MISSED CALL
    await axios.post("/api/calls/missed", {
      caller: incomingCall.fromUser?._id,
      receiver: user._id,
      type: incomingCall.video ? "video" : "audio",
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
};

export default CallContext;
