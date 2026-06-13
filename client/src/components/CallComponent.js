import React, { useContext, useEffect, useRef, useState } from "react";
import CallContext from "../context/CallContext";
import AuthContext from "../auth/AuthContext";
import CallUI from "./call/CallUI";
import useCallControls from "./call/useCallControls";
import useCallSocket from "./call/useCallSocket";
import useCallWebrtc from "./call/useCallWebRTC";

const CallComponent = () => {
  const callContext = useContext(CallContext);
  const { user } = useContext(AuthContext);

  const {
    incomingCall,
    callAccepted,
    currentCallUser,
    callData,
    setCurrentCallUser,
    setCallAccepted,
    startCallingSound,
  } = callContext;

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const userAudio = useRef(null);
  const peerRef = useRef(null);
  const startedRef = useRef(false);
  const originalCameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const signalAppliedRef = useRef(false);
  const callIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const callContainerRef = useRef(null);

  const joinSound = useRef(null);
  const leaveSound = useRef(null);
  const muteSound = useRef(null);
  const unmuteSound = useRef(null);
  const screenshotSound = useRef(null);
  const recordStartSound = useRef(null);
  const recordStopSound = useRef(null);
  const unansweredTimeoutRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Connexion...");
  const [callStarted, setCallStarted] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [networkQuality, setNetworkQuality] = useState("Excellent");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [ringingTimeLeft, setRingingTimeLeft] = useState(30);
  const [videoPosition, setVideoPosition] = useState({
    x: window.innerWidth - 180,
    y: 20,
  });
  const [miniPosition, setMiniPosition] = useState({
    x: window.innerWidth - 340,
    y: 20,
  });

  const refs = {
    myVideo,
    userVideo,
    userAudio,
    peerRef,
    startedRef,
    originalCameraStreamRef,
    screenStreamRef,
    localStreamRef,
    signalAppliedRef,
    callIdRef,
    mediaRecorderRef,
    recordedChunksRef,
    callContainerRef,
    joinSound,
    leaveSound,
    muteSound,
    unmuteSound,
    screenshotSound,
    recordStartSound,
    recordStopSound,
    unansweredTimeoutRef,
  };

  const state = {
    isMuted,
    cameraOff,
    facingMode,
    callDuration,
    connectionStatus,
    callStarted,
    remoteMuted,
    remoteCameraOff,
    networkQuality,
    isMinimized,
    isRecording,
    isScreenSharing,
    videoPosition,
    miniPosition,
  };

  const setters = {
    setIsMuted,
    setCameraOff,
    setFacingMode,
    setCallDuration,
    setConnectionStatus,
    setCallStarted,
    setRemoteMuted,
    setRemoteCameraOff,
    setNetworkQuality,
    setIsMinimized,
    setIsRecording,
    setIsScreenSharing,
    setVideoPosition,
    setMiniPosition,
  };

  const isVideoCall = incomingCall?.video === true || callData?.video === true;

  useEffect(() => {
    if (!callData || callAccepted) return;

    startCallingSound();

    if (!callData.user?._id) return;

    setCurrentCallUser(callData.user);
    setCallAccepted(true);
  }, [
    callData,
    callAccepted,
    setCallAccepted,
    setCurrentCallUser,
    startCallingSound,
  ]);

  useEffect(() => {
    if (callAccepted) {
      joinSound.current?.play();
    }
  }, [callAccepted, joinSound]);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.08); }
        100% { transform: scale(1); }
      }

      @keyframes fadeInCall {
        from { opacity: 0; transform: scale(1.03); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes glowPulse {
        0% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
        50% { box-shadow: 0 0 25px rgba(255,255,255,0.5); }
        100% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
      }

      @keyframes floating {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
        100% { transform: translateY(0px); }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

 useEffect(() => {
   const unlockAudio = () => {
     userVideo.current?.play().catch(() => {});
      userAudio.current?.play().catch(() => {});
   };

   window.addEventListener("click", unlockAudio);

   return () => window.removeEventListener("click", unlockAudio);
 }, []);

  const { formatDuration, controls, dragHandlers } = useCallControls({
    callContext,
    refs,
    state,
    setters,
    isVideoCall,
  });

  useEffect(() => {
    if (!currentCallUser || callStarted) return;

    console.log("⏰ TIMER 30s CRÉÉ");

    const timeout = setTimeout(() => {
      console.log("⏰ APPEL EXPIRÉ APRÈS 30s");

      controls.endCall();
    }, 30000);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentCallUser, callStarted]);

  useCallSocket({
    callContext,
    refs,
    setters,
  });

  useCallWebrtc({
    callContext,
    refs,
    state,
    setters,
    user,
  });

  useEffect(() => {
    joinSound.current = new Audio("/sounds/join.mp3");

    leaveSound.current = new Audio("/sounds/leave.mp3");

    muteSound.current = new Audio("/sounds/mute.mp3");

    unmuteSound.current = new Audio("/sounds/unmute.mp3");

    screenshotSound.current = new Audio("/sounds/screenshot.mp3");

    recordStartSound.current = new Audio("/sounds/record-start.mp3");

    recordStopSound.current = new Audio("/sounds/record-stop.mp3");
  }, []);

  useEffect(() => {
    if (!currentCallUser || callStarted) return;

    setRingingTimeLeft(30);

    const interval = setInterval(() => {
      setRingingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          console.log("⏰ COMPTEUR TERMINÉ");

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCallUser, callStarted]);

  useEffect(() => {
    if (incomingCall?.callId) {
      callIdRef.current = incomingCall.callId;

      console.log("CALL ID STOCKÉ RECEVEUR =", callIdRef.current);
    }
  }, [incomingCall]);

  return (
    <CallUI
      refs={refs}
      state={state}
      currentCallUser={currentCallUser}
      isVideoCall={isVideoCall}
      formatDuration={formatDuration}
      controls={controls}
      dragHandlers={dragHandlers}
      callStarted={callStarted}
      ringingTimeLeft={ringingTimeLeft}
    />
  );
};

export default CallComponent;