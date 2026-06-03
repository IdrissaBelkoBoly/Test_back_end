import React, { useContext, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import CallContext from "../context/CallContext";
import AuthContext from "../auth/AuthContext";

const CallComponent = () => {
  const {
    socket,
    incomingCall,
    callAccepted,
    currentCallUser,
    callData,
    setCurrentCallUser,
    setCallAccepted,
    setCallData,
    setIncomingCall,
    startCallingSound,
    stopSounds,
  } = useContext(CallContext);

  const { user } = useContext(AuthContext);

  const myVideo = useRef();
  const userVideo = useRef();
  const startedRef = useRef(false);
  const peerRef = useRef();
  const originalCameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const signalAppliedRef = useRef(false);
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

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [videoPosition, setVideoPosition] = useState({
    x: window.innerWidth - 180,
    y: 20,
  });

  const dragRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
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
  const [miniPosition, setMiniPosition] = useState({
    x: window.innerWidth - 340,
    y: 20,
  });

  const miniDragRef = useRef(false);

  const miniOffsetRef = useRef({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      //startedRef.current = false;
    };
  }, []);

  useEffect(() => {
    signalAppliedRef.current = false;
  }, [callData, incomingCall]);

  useEffect(() => {
    if (!callData || callAccepted) return;

    startCallingSound();

    console.log("🚀 START CALL:", callData);

    if (!callData.user?._id) {
      console.log("❌ user invalide");
      return;
    }

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
  }, [callAccepted]);

  useEffect(() => {
    socket.on("callEnded", () => {
      console.log("📴 appel terminé");

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      startedRef.current = false;

      setCallAccepted(false);
      setCurrentCallUser(null);
      setCallData(null);
      setIncomingCall(null);
      setCallStarted(false);
      setCallDuration(0);
      setConnectionStatus("Connexion...");
    });

    return () => {
      socket.off("callEnded");
    };
  }, [
    socket,
    setCallAccepted,
    setCurrentCallUser,
    setIncomingCall,
    setCallData,
  ]);

  useEffect(() => {
    if (!callAccepted || startedRef.current) return;
    startedRef.current = true;

    console.log("🚀 START UNIQUE");

    if (!incomingCall && !callData) {
      console.log("❌ Pas de callData ni incomingCall");
      // startedRef.current = false;
      return;
    }

    console.log("📊 DEBUG STATE");
    console.log("incomingCall:", incomingCall);
    console.log("currentCallUser:", currentCallUser);
    console.log("callData:", callData);

    let handleAccepted;

    const start = async () => {
      stopSounds();

      if (peerRef.current) {
        console.log("⛔ Peer déjà existant, STOP");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video:
          (callData?.video ?? true)
            ? {
                facingMode,
              }
            : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      originalCameraStreamRef.current = stream;

      // ✅ AJOUT ICI
      console.log("🎥 STREAM LOCAL:", stream);

      if (!stream) {
        console.log("❌ PAS DE STREAM");
      }

      localStreamRef.current = stream;

      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        myVideo.current.muted = true;
        myVideo.current.play().catch(() => {});
      }

      const peer = new Peer({
        initiator: !incomingCall,
        trickle: false,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peer.on("connect", () => {
        console.log("🟢 PEER CONNECTED");

        setNetworkQuality("Excellent");
      });

      peerRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.on("error", (err) => {
        console.log("❌ PEER ERROR:", err);
      });

      peer.on("close", () => {
        console.log("🔌 PEER CLOSED");
        setNetworkQuality("Connexion perdue");
      });

      // 🔥 SIGNAL
      peer.on("signal", (data) => {
        console.log("📤 SIGNAL:", data.type);

        if (incomingCall) {
          socket.emit("acceptCall", {
            signal: data,
            to: incomingCall.from,
          });
        } else {
          if (!currentCallUser?._id) {
            console.log("❌ Aucun utilisateur à appeler");
            return;
          }

          socket.emit("callUser", {
            userToCall: currentCallUser._id,
            signalData: data,
            from: socket.id,
            fromUser: {
              _id: user._id,
              name: user.name,
              email: user.email,
              profilePicture: user.profilePicture,
            },
            video: callData?.video ?? true,
          });
        }
      });

      // 🔥 STREAM
      peer.on("stream", (remoteStream) => {
        console.log("📡 STREAM reçu");

        setConnectionStatus("En appel");

        setCallStarted(true);

        setRemoteCameraOff(false);

        // 🚫 éviter de recevoir son propre stream
        if (
          localStreamRef.current &&
          remoteStream.id === localStreamRef.current.id
        ) {
          console.log("⛔ stream local ignoré");
          return;
        }

        remoteStream.getTracks().forEach((track) => {
          track.onmute = () => {
            console.log(`🔇 TRACK MUTE: ${track.kind}`);
          };

          track.onunmute = () => {
            console.log(`🔊 TRACK UNMUTE: ${track.kind}`);
          };

          track.onended = () => {
            console.log(`❌ TRACK ENDED: ${track.kind}`);
          };
        });

        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;

          userVideo.current.muted = false;

          userVideo.current.onloadedmetadata = () => {
            userVideo.current.play().catch((err) => {
              console.log("❌ PLAY ERROR:", err);
            });
          };
        }
      });

      let answerApplied = false;

      handleAccepted = (signal) => {
        if (answerApplied) {
          console.log("⛔ answer déjà appliqué");
          return;
        }

        answerApplied = true;

        console.log("✅ SIGNAL reçu côté caller");

        peer.signal(signal);
      };

      socket.off("callAccepted");
      socket.on("callAccepted", handleAccepted);

      if (incomingCall && !signalAppliedRef.current) {
        console.log("📥 APPLY SIGNAL receiver");

        signalAppliedRef.current = true;

        peer.signal(incomingCall.signal);
      }
    };

    start().catch((err) => {
      console.log("❌ START ERROR:", err);
      // startedRef.current = false;
    });

    return () => {
      if (handleAccepted) {
        socket.off("callAccepted", handleAccepted);
      }
    };
  }, [
    callAccepted,
    callData,
    currentCallUser,
    incomingCall,
    callData?.video,
    socket,
    user._id,
    user.email,
    user.name,
    user.profilePicture,
    stopSounds,
    facingMode,
  ]);

  useEffect(() => {
    let interval;

    if (callStarted) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [callStarted]);

  // 🔊 MUTE
  const toggleMute = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    socket.emit("toggleMute", {
      to: incomingCall?.from || currentCallUser?._id,
      muted: !audioTrack.enabled,
    });

    if (!isMuted) {
      muteSound.current?.play();
    } else {
      unmuteSound.current?.play();
    }

    setIsMuted(!audioTrack.enabled);

    console.log("🎤 audio:", audioTrack.enabled);
  };

  // 📷 CAMERA
  const toggleCamera = () => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    socket.emit("toggleCamera", {
      to: incomingCall?.from || currentCallUser?._id,
      cameraOff: !videoTrack.enabled,
    });

    if (myVideo.current) {
      myVideo.current.srcObject = null;

      setTimeout(() => {
        myVideo.current.srcObject = stream;
      }, 100);
    }

    console.log("📷 CAMERA:", videoTrack.enabled);

    setCameraOff(!videoTrack.enabled);
  };

  const handleMouseDown = (e) => {
    dragRef.current = true;

    offsetRef.current = {
      x: e.clientX - videoPosition.x,
      y: e.clientY - videoPosition.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current) return;

    setVideoPosition({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    });
  };

  const handleMouseUp = () => {
    dragRef.current = false;
  };

  const handleMiniMouseDown = (e) => {
    if (!isMinimized) return;

    miniDragRef.current = true;

    miniOffsetRef.current = {
      x: e.clientX - miniPosition.x,
      y: e.clientY - miniPosition.y,
    };
  };

  const handleMiniMouseMove = (e) => {
    if (!miniDragRef.current) return;

    setMiniPosition({
      x: e.clientX - miniOffsetRef.current.x,
      y: e.clientY - miniOffsetRef.current.y,
    });
  };

  const handleMiniMouseUp = () => {
    miniDragRef.current = false;
  };

  const switchCamera = async () => {
    try {
      const newFacingMode = facingMode === "user" ? "environment" : "user";

      setFacingMode(newFacingMode);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
        },
        audio: true,
      });

      const videoTrack = newStream.getVideoTracks()[0];

      const sender = peerRef.current._pc
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      // stop anciennes tracks vidéo
      localStreamRef.current.getVideoTracks().forEach((track) => track.stop());

      // remplacer dans stream local
      localStreamRef.current.removeTrack(
        localStreamRef.current.getVideoTracks()[0],
      );

      localStreamRef.current.addTrack(videoTrack);

      if (myVideo.current) {
        myVideo.current.srcObject = newStream;
      }

      console.log("📷 CAMERA SWITCH:", newFacingMode);
    } catch (err) {
      console.log("❌ SWITCH CAMERA ERROR:", err);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60).toString().padStart(2, "0");

    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];

      // =========================
      // CANVAS
      // =========================

      const canvas = document.createElement("canvas");

      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");

      // =========================
      // STREAM
      // =========================

      const canvasStream = canvas.captureStream(30);

      // AUDIO LOCAL
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      // AUDIO DISTANT
      if (userVideo.current?.srcObject) {
        userVideo.current.srcObject.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      // =========================
      // MEDIA RECORDER
      // =========================

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = isVideoCall
          ? `video-call-${Date.now()}.webm`
          : `audio-call-${Date.now()}.webm`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      };

      mediaRecorder.start(100);

      setIsRecording(true);

      recordStartSound.current?.play();

      console.log("🔴 RECORD START");

      // =========================
      // RENDER LOOP
      // =========================

      let recordingActive = true;

      const renderFrame = () => {
        if (!recordingActive) return;

        // CLEAR
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // =========================
        // VIDEO CALL
        // =========================

        if (isVideoCall) {
          // VIDEO DISTANTE
          if (userVideo.current && userVideo.current.readyState >= 2) {
            ctx.drawImage(userVideo.current, 0, 0, canvas.width, canvas.height);
          }

          // PETITE VIDEO
          if (myVideo.current && myVideo.current.readyState >= 2) {
            ctx.drawImage(myVideo.current, canvas.width - 260, 40, 220, 150);
          }

          // TIMER
          ctx.fillStyle = "rgba(0,0,0,0.5)";

          ctx.fillRect(30, 30, 260, 120);

          ctx.fillStyle = "white";

          ctx.font = "30px Arial";

          ctx.fillText(`⏱ ${formatDuration(callDuration)}`, 50, 70);

          ctx.font = "24px Arial";

          ctx.fillText(connectionStatus, 50, 110);
        }

        // =========================
        // AUDIO CALL
        // =========================
        else {
          ctx.fillStyle = "#111";

          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // PHOTO
          const img = new Image();

          img.src = currentCallUser?.profilePicture
            ? `http://localhost:5000${currentCallUser.profilePicture}`
            : "/default-avatar.png";

          img.onload = () => {
            ctx.save();

            ctx.beginPath();

            ctx.arc(180, 220, 90, 0, Math.PI * 2);

            ctx.closePath();

            ctx.clip();

            ctx.drawImage(img, 90, 130, 180, 180);

            ctx.restore();
          };

          // NOM
          ctx.fillStyle = "white";

          ctx.font = "42px Arial";

          ctx.fillText(currentCallUser?.name || "Audio Call", 320, 220);

          // TIMER
          ctx.font = "30px Arial";

          ctx.fillText(`⏱ ${formatDuration(callDuration)}`, 320, 280);

          // STATUS
          ctx.font = "26px Arial";

          ctx.fillText(connectionStatus, 320, 340);
        }

        // =========================
        // BOUTONS
        // =========================

        ctx.fillStyle = "rgba(0,0,0,0.5)";

        ctx.fillRect(canvas.width / 2 - 180, canvas.height - 110, 360, 70);

        ctx.fillStyle = "white";

        ctx.font = "34px Arial";

        ctx.fillText("🎤 📷 ❌", canvas.width / 2 - 90, canvas.height - 65);

        requestAnimationFrame(renderFrame);
      };

      renderFrame();

      // STOP LOOP
      mediaRecorderRef.current.recordingActive = () => {
        recordingActive = false;
      };
    } catch (err) {
      console.log("❌ RECORD ERROR:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.recordingActive) {
        mediaRecorderRef.current.recordingActive();
      }

      mediaRecorderRef.current.stop();

      setIsRecording(false);

      recordStopSound.current?.play();

      console.log("⏹ RECORD STOP");
    }
  };

  const takeScreenshot = async () => {
    try {
      const canvas = document.createElement("canvas");

      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");

      // =========================
      // VIDEO CALL
      // =========================

      if (isVideoCall) {
        // VIDEO PRINCIPALE
        if (userVideo.current && userVideo.current.readyState >= 2) {
          ctx.drawImage(userVideo.current, 0, 0, canvas.width, canvas.height);
        }

        // PETITE VIDEO
        if (myVideo.current && myVideo.current.readyState >= 2) {
          ctx.drawImage(myVideo.current, canvas.width - 260, 40, 220, 150);
        }
      }

      // =========================
      // AUDIO CALL UI
      // =========================

      if (!isVideoCall) {
        ctx.fillStyle = "#111";

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const profileImg = new Image();

        profileImg.crossOrigin = "anonymous";

        profileImg.src = currentCallUser?.profilePicture
          ? `http://localhost:5000${currentCallUser.profilePicture}`
          : "/default-avatar.png";

        await new Promise((resolve) => {
          profileImg.onload = resolve;
          profileImg.onerror = resolve;
        });

        // PHOTO DE PROFIL
        ctx.save();

        ctx.beginPath();

        ctx.arc(140, 170, 80, 0, Math.PI * 2);

        ctx.closePath();

        ctx.clip();

        ctx.drawImage(profileImg, 60, 90, 160, 160);

        ctx.restore();

        ctx.fillStyle = "white";

        ctx.font = "40px Arial";

        ctx.fillText(currentCallUser?.name || "Audio Call", 260, 170);

        ctx.font = "28px Arial";

        ctx.fillText(`⏱ ${formatDuration(callDuration)}`, 260, 240);

        ctx.fillText(connectionStatus, 260, 300);
      }

      // =========================
      // STATUS BOX
      // =========================

      ctx.fillStyle = "rgba(0,0,0,0.5)";

      ctx.fillRect(30, 30, 260, 120);

      ctx.fillStyle = "white";

      ctx.font = "30px Arial";

      ctx.fillText(`⏱ ${formatDuration(callDuration)}`, 50, 80);

      // =========================
      // DOWNLOAD
      // =========================

      const image = canvas.toDataURL("image/png");

      const a = document.createElement("a");

      a.href = image;

      a.download = `call-screenshot-${Date.now()}.png`;

      a.click();

      screenshotSound.current?.play();

      console.log("📸 SCREENSHOT SAVED");
    } catch (err) {
      console.log("❌ SCREENSHOT ERROR:", err);
    }
  };

  // ❌ END CALL
  const endCall = () => {
    leaveSound.current?.play();

    console.log("📴 END CALL CLICK");

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    }

    if (originalCameraStreamRef.current) {
      originalCameraStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      originalCameraStreamRef.current = null;
    }

    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;

    if (peerRef.current) {
      const senders = peerRef.current?._pc?.getSenders();

      senders?.forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerRef.current.destroy();
      peerRef.current = null;
    }

    /* if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }*/

    startedRef.current = false;

    socket.emit("endCall", {
      to: incomingCall?.from || currentCallUser?._id,
      from: socket.id,
    });

    setCallAccepted(false);
    setCurrentCallUser(null);
    setCallData(null);
    setIncomingCall(null);
    setCallStarted(false);
    setCallDuration(0);
    setConnectionStatus("Connexion...");
  };

  const isVideoCall = incomingCall?.video === true || callData?.video === true;
  console.log("🎬 isVideoCall:", isVideoCall);

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

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
    @keyframes fadeInCall {
      from {
        opacity: 0;
        transform: scale(1.03);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes glowPulse {
      0% {
        box-shadow: 0 0 10px rgba(255,255,255,0.2);
      }

      50% {
        box-shadow: 0 0 25px rgba(255,255,255,0.5);
      }

      100% {
        box-shadow: 0 0 10px rgba(255,255,255,0.2);
      }
    }

    @keyframes floating {
      0% {
        transform: translateY(0px);
      }

      50% {
        transform: translateY(-5px);
      }

      100% {
        transform: translateY(0px);
      }
    }
  `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const handleRemoteMute = (data) => {
      setRemoteMuted(data.muted);
    };

    socket.on("remoteMuteChanged", handleRemoteMute);

    return () => {
      socket.off("remoteMuteChanged", handleRemoteMute);
    };
  }, [socket]);

  useEffect(() => {
    const handleRemoteCamera = (data) => {
      setRemoteCameraOff(data.cameraOff);
    };

    socket.on("remoteCameraChanged", handleRemoteCamera);

    return () => {
      socket.off("remoteCameraChanged", handleRemoteCamera);
    };
  }, [socket]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    window.addEventListener("mousemove", handleMiniMouseMove);

    window.addEventListener("mouseup", handleMiniMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      window.removeEventListener("mousemove", handleMiniMouseMove);

      window.removeEventListener("mouseup", handleMiniMouseUp);
    };
  }, []);

  const startScreenShare = async () => {
    try {
      // GET SCREEN
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      // SENDER
      const sender = peerRef.current?._pc
        .getSenders()
        .find((s) => s.track?.kind === "video");

      // REPLACE VIDEO
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      setIsScreenSharing(true);

      console.log("🖥️ SCREEN SHARE START");

      // STOP SHARE
      screenTrack.onended = async () => {
        try {
          console.log("🛑 SCREEN SHARE STOP");

          // STOP SCREEN STREAM
          screenStream.getTracks().forEach((track) => {
            track.stop();
          });

          setIsScreenSharing(false);

          // REPRENDRE LA CAMERA ORIGINALE
          const originalStream = originalCameraStreamRef.current;

          if (!originalStream) {
            console.log("❌ NO ORIGINAL CAMERA");
            return;
          }

          // TRACK CAMERA
          const cameraTrack = originalStream.getVideoTracks()[0];

          // REPLACE TRACK CHEZ LE REMOTE USER
          const sender = peerRef.current?._pc
            ?.getSenders()
            .find((s) => s.track?.kind === "video");

          if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack);
          }

          // REMETTRE LA VIDEO LOCALE
          if (myVideo.current) {
            myVideo.current.srcObject = originalStream;

            myVideo.current.onloadedmetadata = async () => {
              try {
                await myVideo.current.play();
              } catch (err) {
                console.log("PLAY ERROR:", err);
              }
            };
          }

          console.log("📷 BACK CAMERA");
        } catch (err) {
          console.log("❌ SCREEN STOP ERROR:", err);
        }
      };
    } catch (err) {
      console.log("❌ SCREEN SHARE ERROR:", err);
    }
  };

  return (
    <div
      ref={callContainerRef}
      onMouseDown={isMinimized ? handleMiniMouseDown : null}
      style={{
        position: "fixed",
        top: isMinimized ? `${miniPosition.y}px` : 0,
        left: isMinimized ? `${miniPosition.x}px` : 0,

        width: isMinimized ? "320px" : "100%",
        height: isMinimized ? "220px" : "100vh",
        background: "black",
        animation: "fadeInCall 0.4s ease",
        zIndex: 9999,
        borderRadius: isMinimized ? "20px" : "0px",
        overflow: "hidden",
        boxShadow: isMinimized ? "0 0 30px rgba(0,0,0,0.5)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {isVideoCall ? (
        <>
          {/* VIDEO CALL */}
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              background: "#111",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <video
                ref={userVideo}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: remoteCameraOff ? "none" : "block",
                }}
              />

              {isScreenSharing && (
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.6)",
                    padding: "12px 25px",
                    borderRadius: "20px",
                    color: "white",
                    fontSize: "22px",
                    fontWeight: "bold",
                    zIndex: 9999,
                  }}
                >
                  🖥️ Vous partagez votre écran
                </div>
              )}
            </div>

            {remoteCameraOff && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                }}
              >
                <img
                  src={
                    currentCallUser?.profilePicture
                      ? `http://localhost:5000${currentCallUser.profilePicture}`
                      : "/default-avatar.png"
                  }
                  alt="profile"
                  style={{
                    width: "180px",
                    height: "180px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "20px",
                  }}
                />

                <h2>{currentCallUser?.name}</h2>

                <p>📷 Caméra désactivée</p>
              </div>
            )}
          </div>
          {remoteMuted && (
            <div
              style={{
                position: "absolute",
                top: "100px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.6)",
                padding: "10px 20px",
                borderRadius: "20px",
                color: "#ff4d4f",
                fontSize: "16px",
                fontWeight: "bold",
                backdropFilter: "blur(10px)",
                zIndex: 999,
              }}
            >
              🎤 Micro coupé
            </div>
          )}
          {!isMinimized && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.5)",
                color: "white",
                padding: "8px 15px",
                borderRadius: "20px",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              ⏱ {formatDuration(callDuration)}
              <div
                style={{
                  marginTop: "10px",
                  textAlign: "center",
                  color: "white",
                  fontSize: "16px",
                }}
              >
                {connectionStatus}

                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "16px",
                    color:
                      networkQuality === "Excellent"
                        ? "#00ff99"
                        : networkQuality === "Connexion faible"
                          ? "#ffcc00"
                          : "#ff4d4f",
                  }}
                >
                  📶 {networkQuality}
                </p>
              </div>
            </div>
          )}
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            onMouseDown={!isMinimized ? handleMouseDown : null}
            onLoadedMetadata={() => {
              myVideo.current?.play();
            }}
            style={{
              position: "absolute",

              top: isMinimized ? "10px" : `${videoPosition.y}px`,
              left: isMinimized ? "10px" : `${videoPosition.x}px`,

              width: isMinimized ? "90px" : "150px",
              height: isMinimized ? "70px" : "100px",

              cursor: isMinimized ? "default" : "grab",

              zIndex: 999,

              borderRadius: "10px",
              border: "2px solid white",
              animation: "glowPulse 2s infinite",
              boxShadow: "0 0 20px rgba(255,255,255,0.3)",
              objectFit: "cover",
            }}
          />
        </>
      ) : (
        <>
          {/* AUDIO CALL */}

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              background: "#111",
            }}
          >
            <img
              src={
                currentCallUser?.profilePicture
                  ? `http://localhost:5000${currentCallUser.profilePicture}`
                  : "/default-avatar.png"
              }
              alt="profile"
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "20px",
                animation: "pulse 1.5s infinite",
                boxShadow: "0 0 30px rgba(0,255,0,0.6)",
              }}
            />

            <h2>{currentCallUser?.name}</h2>

            <p style={{ marginTop: "10px", fontSize: "20px" }}>
              ⏱ {formatDuration(callDuration)}
            </p>

            <p
              style={{
                opacity: 0.7,
                marginTop: "10px",
                fontSize: "18px",
              }}
            >
              {connectionStatus}

              <p
                style={{
                  marginTop: "8px",
                  fontSize: "16px",
                  color:
                    networkQuality === "Excellent"
                      ? "#00ff99"
                      : networkQuality === "Connexion faible"
                        ? "#ffcc00"
                        : "#ff4d4f",
                }}
              >
                📶 {networkQuality}
              </p>
            </p>

            {remoteMuted && (
              <p
                style={{
                  marginTop: "10px",
                  color: "#ff4d4f",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                🎤 Micro coupé
              </p>
            )}
          </div>

          {/* AUDIO ELEMENT */}
          <audio ref={userVideo} autoPlay />
        </>
      )}

      {/* CONTROLS */}

      <div
        style={{
          position: "absolute",

          bottom: isMinimized ? "10px" : "30px",

          left: "50%",
          transform: "translateX(-50%)",

          display: "flex",
          alignItems: "center",

          gap: isMinimized ? "10px" : "20px",

          background: "rgba(0,0,0,0.4)",

          padding: isMinimized ? "8px 12px" : "15px 25px",

          borderRadius: "50px",

          backdropFilter: "blur(10px)",

          zIndex: 9999,
        }}
      >
        <button
          onClick={toggleMute}
          style={{
            width: isMinimized ? "40px" : "60px",
            height: isMinimized ? "40px" : "60px",
            fontSize: isMinimized ? "18px" : "24px",
            borderRadius: "50%",
            border: "none",
            background: isMuted ? "#ff4d4f" : "#2c2c2c",
            color: "white",

            cursor: "pointer",
            transition: "all 0.3s ease",
            animation: "floating 3s ease-in-out infinite",
          }}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        {isVideoCall && !isMinimized && (
          <>
            <button
              onClick={toggleCamera}
              style={{
                width: isMinimized ? "40px" : "60px",
                height: isMinimized ? "40px" : "60px",
                fontSize: isMinimized ? "18px" : "24px",
                borderRadius: "50%",
                border: "none",
                background: cameraOff ? "#ff4d4f" : "#2c2c2c",
                color: "white",

                cursor: "pointer",
                transition: "all 0.3s ease",
                animation: "floating 3s ease-in-out infinite",
              }}
            >
              {cameraOff ? "📷❌" : "📷"}
            </button>

            <button
              onClick={switchCamera}
              style={{
                width: isMinimized ? "40px" : "60px",
                height: isMinimized ? "40px" : "60px",
                fontSize: isMinimized ? "18px" : "24px",
                borderRadius: "50%",
                border: "none",
                background: "#2c2c2c",
                color: "white",

                cursor: "pointer",
                transition: "all 0.3s ease",
                animation: "floating 3s ease-in-out infinite",
              }}
            >
              🔄
            </button>

            <button
              onClick={startScreenShare}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "none",
                background: isScreenSharing ? "#00cc66" : "#2c2c2c",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              🖥️
            </button>
          </>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: isMinimized ? "40px" : "60px",
            height: isMinimized ? "40px" : "60px",

            borderRadius: "50%",

            border: "none",

            background: isRecording ? "#ff0000" : "#2c2c2c",

            color: "white",

            fontSize: isMinimized ? "18px" : "24px",

            cursor: "pointer",

            animation: isRecording
              ? "pulse 1s infinite"
              : "floating 3s ease-in-out infinite",
          }}
        >
          {isRecording ? "⏹" : "🔴"}
        </button>

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            width: isMinimized ? "40px" : "60px",
            height: isMinimized ? "40px" : "60px",
            fontSize: isMinimized ? "18px" : "24px",
            borderRadius: "50%",
            border: "none",
            background: "#2c2c2c",
            color: "white",

            cursor: "pointer",
          }}
        >
          {isMinimized ? "🗖" : "🗕"}
        </button>

        <button
          onClick={takeScreenshot}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            background: "#2c2c2c",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
          }}
        >
          📸
        </button>

        <button
          onClick={endCall}
          style={{
            width: isMinimized ? "50px" : "70px",
            height: isMinimized ? "50px" : "70px",
            fontSize: isMinimized ? "22px" : "30px",
            borderRadius: "50%",
            border: "none",
            background: "#ff3b30",
            color: "white",

            cursor: "pointer",
            boxShadow: "0 0 20px rgba(255,59,48,0.6)",
            transition: "all 0.3s ease",
            animation: "floating 3s ease-in-out infinite",
          }}
        >
          ❌
        </button>
      </div>

      <audio ref={joinSound} src="/sounds/join.mp3" />

      <audio ref={leaveSound} src="/sounds/leave.mp3" />

      <audio ref={muteSound} src="/sounds/mute.mp3" />

      <audio ref={unmuteSound} src="/sounds/unmute.mp3" />

      <audio ref={screenshotSound} src="/sounds/screenshot.mp3" />

      <audio ref={recordStartSound} src="/sounds/record-start.mp3" />

      <audio ref={recordStopSound} src="/sounds/record-stop.mp3" />
    </div>
  );
};

export default CallComponent;
