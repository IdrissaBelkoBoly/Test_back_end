import React, { useState } from "react";

const buttonStyle = ({ size = 60, fontSize = 24, background = "#2c2c2c" }) => ({
  width: `${size}px`,
  height: `${size}px`,
  fontSize: `${fontSize}px`,
  borderRadius: "50%",
  border: "none",
  background,
  color: "white",
  cursor: "pointer",
  transition: "all 0.3s ease",
});

const networkColor = (networkQuality) => {
  if (networkQuality === "Excellent") return "#00ff99";

  if (networkQuality === "Connexion faible") {
    return "#ffcc00";
  }

  return "#ff4d4f";
};

//
// ================= REMOTE CAMERA OFF =================
//

const RemoteCameraOff = ({ currentCallUser }) => (
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
);

//
// ================= STATUS BADGE =================
//

const StatusBadge = ({
  callDuration,
  connectionStatus,
  networkQuality,
  formatDuration,
}) => (
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
      textAlign: "center",
    }}
  >
    ⏱ {formatDuration(callDuration)}
    <div
      style={{
        marginTop: "10px",
        fontSize: "16px",
      }}
    >
      {connectionStatus}

      <p
        style={{
          marginTop: "8px",
          color: networkColor(networkQuality),
        }}
      >
        📶 {networkQuality}
      </p>
    </div>
  </div>
);

//
// ================= REMOTE MUTED BADGE =================
//

const RemoteMutedBadge = () => (
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
);

//
// ================= AUDIO CALL VIEW =================
//

const AudioCallView = ({
  currentCallUser,
  callDuration,
  connectionStatus,
  networkQuality,
  remoteMuted,
  formatDuration,
}) => (
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

    <p
      style={{
        marginTop: "10px",
        fontSize: "20px",
      }}
    >
      ⏱ {formatDuration(callDuration)}
    </p>

    <div
      style={{
        opacity: 0.7,
        marginTop: "10px",
        fontSize: "18px",
        textAlign: "center",
      }}
    >
      {connectionStatus}

      <p
        style={{
          marginTop: "8px",
          color: networkColor(networkQuality),
        }}
      >
        📶 {networkQuality}
      </p>
    </div>

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
);

//
// ================= MAIN COMPONENT =================
//

const CallUI = ({
  refs,
  state,
  currentCallUser,
  isVideoCall,
  formatDuration,
  controls,
  dragHandlers,
}) => {
  const { myVideo, userVideo, userAudio, callContainerRef } = refs;

  const {
    isMuted,
    cameraOff,
    callDuration,
    connectionStatus,
    remoteMuted,
    remoteCameraOff,
    networkQuality,
    isMinimized,
    isRecording,
    isScreenSharing,
    videoPosition,
    miniPosition,
  } = state;

  const controlSize = isMinimized ? 40 : 60;
  const controlFontSize = isMinimized ? 18 : 24;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      ref={callContainerRef}
      onMouseDown={
        isMinimized
          ? dragHandlers.handleMiniMouseDown
          : dragHandlers.handleMouseDown
      }
      onMouseMove={
        isMinimized
          ? dragHandlers.handleMiniMouseMove
          : dragHandlers.handleMouseMove
      }
      onMouseUp={
        isMinimized
          ? dragHandlers.handleMiniMouseUp
          : dragHandlers.handleMouseUp
      }
      style={{
        position: "fixed",
        top: isMinimized ? `${miniPosition.y}px` : 0,
        left: isMinimized ? `${miniPosition.x}px` : 0,
        width: isMinimized ? "320px" : "100%",
        height: isMinimized ? "220px" : "100vh",
        background: "black",
        zIndex: 9999,
        borderRadius: isMinimized ? "12px" : "0px",
        overflow: "hidden",
        paddingBottom: isMinimized ? "70px" : "0px",
      }}
    >
      {isVideoCall ? (
        <>
          <video
            ref={userVideo}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <audio ref={userAudio} autoPlay />

          {isScreenSharing && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.6)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "20px",
                fontSize: "16px",
              }}
            >
              🖥️ Partage d’écran actif
            </div>
          )}

          {remoteCameraOff && (
            <RemoteCameraOff currentCallUser={currentCallUser} />
          )}

          {remoteMuted && <RemoteMutedBadge />}

          <StatusBadge
            callDuration={callDuration}
            connectionStatus={connectionStatus}
            networkQuality={networkQuality}
            formatDuration={formatDuration}
          />

          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            onMouseDown={!isMinimized ? dragHandlers.handleMouseDown : null}
            style={{
              position: "absolute",
              top: isMinimized
                ? Math.min(videoPosition.y, 120)
                : videoPosition.y,

              left: isMinimized
                ? Math.min(videoPosition.x, 200)
                : videoPosition.x,

              width: "150px",
              height: "100px",
              borderRadius: "10px",
              objectFit: "cover",
              cursor: "move",
              userSelect: "none",
            }}
          />
        </>
      ) : (
        <AudioCallView
          currentCallUser={currentCallUser}
          callDuration={callDuration}
          connectionStatus={connectionStatus}
          networkQuality={networkQuality}
          remoteMuted={remoteMuted}
          formatDuration={formatDuration}
        />
      )}

      <audio ref={userAudio} autoPlay playsInline />

      {showMenu && (
        <div
          style={{
            position: "absolute",
            bottom: "110px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "rgba(0,0,0,0.8)",
            padding: "10px",
            borderRadius: "12px",
            zIndex: 999,
          }}
        >
          <button onClick={controls.switchCamera}>🔄 Caméra</button>

          <button onClick={controls.startScreenShare}>🖥️ Écran</button>

          <button onClick={controls.takeScreenshot}>📸 Capture</button>

          <button
            onClick={
              isRecording ? controls.stopRecording : controls.startRecording
            }
          >
            {isRecording ? "⏹️ Stop" : "🔴 Record"}
          </button>

          <button onClick={() => controls.setIsMinimized(!isMinimized)}>
            {isMinimized ? "⬜ Agrandir" : "➖ Réduire"}
          </button>
        </div>
      )}

      {/* CONTROLS */}
      <div
        style={{
          position: "absolute",
          bottom: isMinimized ? "10px" : "30px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: isMinimized ? "8px" : "20px",
          maxWidth: isMinimized ? "300px" : "600px",
          padding: "6px",
          background: isMinimized ? "rgba(0,0,0,0.5)" : "transparent",
          borderRadius: "12px",
          zIndex: 10,
        }}
      >
        {isRecording && (
          <div
            style={{
              position: "absolute",
              top: "70px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "red",
              color: "white",
              padding: "6px 15px",
              borderRadius: "20px",
              fontSize: "14px",
              animation: "pulse 1s infinite",
            }}
          >
            🔴 Enregistrement en cours
          </div>
        )}
        <button
          onClick={controls.toggleMute}
          style={buttonStyle({
            size: controlSize,
            fontSize: controlFontSize,
            background: isMuted ? "#ff4d4f" : "#2c2c2c",
          })}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        {isVideoCall && (
          <button
            onClick={controls.toggleCamera}
            style={buttonStyle({
              size: controlSize,
              fontSize: controlFontSize,
              background: cameraOff ? "#ff4d4f" : "#2c2c2c",
            })}
          >
            {cameraOff ? "📷❌" : "📷"}
          </button>
        )}

        <button
          onClick={() => setShowMenu(!showMenu)}
          style={buttonStyle({
            size: controlSize,
            fontSize: controlFontSize,
          })}
        >
          ⋮
        </button>

        <button
          onClick={controls.endCall}
          style={{
            width: controlSize,
            height: controlSize,
            fontSize: controlFontSize,
            borderRadius: "50%",
            border: "none",
            background: "#ff3b30",
            color: "white",
          }}
        >
          ❌
        </button>
      </div>
    </div>
  );
};

export default CallUI;











import { useCallback, useEffect, useRef } from "react";
import axios from "axios";

const useCallControls = ({
  callContext,
  refs,
  state,
  setters,
  isVideoCall,
}) => {
  const {
    socket,
    incomingCall,
    currentCallUser,
    setCallAccepted,
    setCurrentCallUser,
    setCallData,
    setIncomingCall,
  } = callContext;

  const {
    myVideo,
    userVideo,
    peerRef,
    startedRef,
    originalCameraStreamRef,
    screenStreamRef,
    localStreamRef,
    mediaRecorderRef,
    recordedChunksRef,
    leaveSound,
    muteSound,
    unmuteSound,
    screenshotSound,
    recordStartSound,
    recordStopSound,
    callIdRef,
  } = refs;

  const dragRef = useRef(false);

  const miniDragRef = useRef(false);

  const offsetRef = useRef({
    x: 0,
    y: 0,
  });

  const miniOffsetRef = useRef({
    x: 0,
    y: 0,
  });

  const { callDuration } = state;

  //
  // ================= FORMAT DURATION =================
  //

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60).toString().padStart(2, "0");

    return `${mins}:${secs}`;
  };

  //
  // ================= TOGGLE MUTE =================
  //

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

    if (!state.isMuted) {
       muteSound.current?.play().catch((err) => {
         console.log("MUTE SOUND ERROR:", err);
       });
    } else {
       unmuteSound.current?.play().catch((err) => {
         console.log("UNMUTE SOUND ERROR:", err);
       });
    }

    setters.setIsMuted(!audioTrack.enabled);
  };

  //
  // ================= TOGGLE CAMERA =================
  //

  const toggleCamera = () => {
    if(!isVideoCall) return;

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

    setters.setCameraOff(!videoTrack.enabled);
  };

  //
  // ================= SWITCH CAMERA =================
  //

  const switchCamera = async () => {
    if(!isVideoCall) return;
    try {
      const newFacingMode =
        state.facingMode === "user" ? "environment" : "user";

      setters.setFacingMode(newFacingMode);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
        },
        audio: true,
      });

      const videoTrack = newStream.getVideoTracks()[0];

      const sender = peerRef.current?._pc
        ?.getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      localStreamRef.current?.getVideoTracks().forEach((track) => track.stop());

      if (myVideo.current) {
        myVideo.current.srcObject = newStream;
      }
    } catch (err) {
      console.log("SWITCH CAMERA ERROR:", err);
    }
  };

  //
  // ================= SCREEN SHARE =================
  //

  const startScreenShare = async () => {
    if(!isVideoCall) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = peerRef.current?._pc
        ?.getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      setters.setIsScreenSharing(true);

      screenTrack.onended = async () => {
        try {
          const originalStream = originalCameraStreamRef.current;

          const cameraTrack = originalStream?.getVideoTracks()[0];

          if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack);
          }

          if (myVideo.current) {
            myVideo.current.srcObject = originalStream;
          }

          setters.setIsScreenSharing(false);
        } catch (err) {
          console.log("SCREEN SHARE STOP ERROR:", err);
        }
      };
    } catch (err) {
      console.log("SCREEN SHARE ERROR:", err);
    }
  };

  //
  // ================= START RECORDING =================
  //

  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];

      const canvas = document.createElement("canvas");

      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");

      const canvasStream = canvas.captureStream(30);

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      if (userVideo.current?.srcObject) {
        userVideo.current.srcObject.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

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

        a.download = `call-record-${Date.now()}.webm`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      };

      mediaRecorder.start(100);

      setters.setIsRecording(true);

      recordStartSound.current?.play();

      let recordingActive = true;

      const renderFrame = () => {
        if (!recordingActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isVideoCall) {
          if (userVideo.current && userVideo.current.readyState >= 2) {
            ctx.drawImage(userVideo.current, 0, 0, canvas.width, canvas.height);
          }

          if (myVideo.current && myVideo.current.readyState >= 2) {
            ctx.drawImage(myVideo.current, canvas.width - 260, 40, 220, 150);
          }
        }

        requestAnimationFrame(renderFrame);
      };

      renderFrame();

      mediaRecorderRef.current.recordingActive = () => {
        recordingActive = false;
      };
    } catch (err) {
      console.log("RECORD ERROR:", err);
    }
  };

  //
  // ================= STOP RECORDING =================
  //

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.recordingActive) {
        mediaRecorderRef.current.recordingActive();
      }

      mediaRecorderRef.current.stop();

      setters.setIsRecording(false);

      recordStopSound.current?.play();
    }
  };

  //
  // ================= SCREENSHOT =================
  //

  const takeScreenshot = async () => {
    try {
      const canvas = document.createElement("canvas");

      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");

      if (isVideoCall) {
        if (userVideo.current && userVideo.current.readyState >= 2) {
          ctx.drawImage(userVideo.current, 0, 0, canvas.width, canvas.height);
        }

        if (myVideo.current && myVideo.current.readyState >= 2) {
          ctx.drawImage(myVideo.current, canvas.width - 260, 40, 220, 150);
        }
      } else {
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
      }

      const image = canvas.toDataURL("image/png");

      const a = document.createElement("a");

      a.href = image;

      a.download = `call-screenshot-${Date.now()}.png`;

      a.click();

      screenshotSound.current?.play();
    } catch (err) {
      console.log("SCREENSHOT ERROR:", err);
    }
  };

  //
  // ================= END CALL =================
  //

  const endCall = async () => {
    leaveSound.current?.play();

    screenStreamRef.current?.getTracks().forEach((track) => track.stop());

    screenStreamRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    localStreamRef.current = null;

    originalCameraStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    originalCameraStreamRef.current = null;

    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }

    if (userVideo.current) {
      userVideo.current.srcObject = null;
    }

    const senders = peerRef.current?._pc?.getSenders();

    senders?.forEach((sender) => {
      sender.track?.stop();
    });

    peerRef.current?.destroy();

    peerRef.current = null;

    startedRef.current = false;

    if (callIdRef.current) {
  await axios.put(`/api/calls/${callIdRef.current}`, {
    status: "ended",
    duration: callDuration,
  });
}

    socket.emit("endCall", {
      to: incomingCall?.from || currentCallUser?._id,
      from: socket.id,
    });

    setCallAccepted(false);

    setCurrentCallUser(null);

    setCallData(null);

    setIncomingCall(null);

    setters.setCallStarted(false);

    setters.setCallDuration(0);

    setters.setConnectionStatus("Connexion...");
  };

  //
  // ================= DRAG =================
  //

  const handleMouseDown = (e) => {
    dragRef.current = true;

    offsetRef.current = {
      x: e.clientX - state.videoPosition.x,

      y: e.clientY - state.videoPosition.y,
    };
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragRef.current) return;

      setters.setVideoPosition({
        x: e.clientX - offsetRef.current.x,

        y: e.clientY - offsetRef.current.y,
      });
    },
    [setters],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = false;
  }, []);

  //
  // ================= MINI DRAG =================
  //

  const handleMiniMouseDown = (e) => {
    if (!state.isMinimized) return;

    miniDragRef.current = true;

    miniOffsetRef.current = {
      x: e.clientX - state.miniPosition.x,

      y: e.clientY - state.miniPosition.y,
    };
  };

  const handleMiniMouseMove = useCallback(
    (e) => {
      if (!miniDragRef.current) return;

      setters.setMiniPosition({
        x: e.clientX - miniOffsetRef.current.x,

        y: e.clientY - miniOffsetRef.current.y,
      });
    },
    [setters],
  );

  const handleMiniMouseUp = useCallback(() => {
    miniDragRef.current = false;
  }, []);

  //
  // ================= EVENTS =================
  //

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
  }, [handleMouseMove, handleMouseUp, handleMiniMouseMove, handleMiniMouseUp]);

  //
  // ================= RETURN =================
  //

  return {
    formatDuration,

    controls: {
      toggleMute,
      toggleCamera,
      switchCamera,
      startScreenShare,
      startRecording,
      stopRecording,
      takeScreenshot,
      endCall,
      setIsMinimized: setters.setIsMinimized,
    },

    dragHandlers: {
      handleMouseDown,
      handleMiniMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMiniMouseMove,
      handleMiniMouseUp,
    },
  };
};

export default useCallControls;











import { useEffect } from "react";

const useCallSocket = ({ callContext, refs, setters }) => {
  const {
    socket,
    setCallAccepted,
    setCurrentCallUser,
    setCallData,
    setIncomingCall,
  } = callContext;

  const { peerRef, localStreamRef, signalAppliedRef } = refs;
  const {
    setCallStarted,
    setCallDuration,
    setConnectionStatus,
    setRemoteMuted,
    setRemoteCameraOff,
  } = setters;

  useEffect(() => {
    signalAppliedRef.current = false;
  }, [callContext.callData, callContext.incomingCall, signalAppliedRef]);

  useEffect(() => {
    const handleCallEnded = () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      refs.startedRef.current = false;

      setCallAccepted(false);
      setCurrentCallUser(null);
      setCallData(null);
      setIncomingCall(null);
      setCallStarted(false);
      setCallDuration(0);
      setConnectionStatus("Connexion...");
    };

    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("callEnded", handleCallEnded);
    };
  }, [
    socket,
    peerRef,
    localStreamRef,
    refs.startedRef,
    setCallAccepted,
    setCurrentCallUser,
    setCallData,
    setIncomingCall,
    setCallStarted,
    setCallDuration,
    setConnectionStatus,
  ]);

  useEffect(() => {
    const handleRemoteMute = (data) => {
      setRemoteMuted(data.muted);
    };

    socket.on("remoteMuteChanged", handleRemoteMute);

    return () => {
      socket.off("remoteMuteChanged", handleRemoteMute);
    };
  }, [socket, setRemoteMuted]);

  useEffect(() => {
    const handleRemoteCamera = (data) => {
      setRemoteCameraOff(data.cameraOff);
    };

    socket.on("remoteCameraChanged", handleRemoteCamera);

    return () => {
      socket.off("remoteCameraChanged", handleRemoteCamera);
    };
  }, [socket, setRemoteCameraOff]);
};

export default useCallSocket;












            import { useEffect } from "react";
    import axios from "axios";
    import Peer from "simple-peer";

    const useCallWebrtc = ({ callContext, refs, state, setters, user }) => {
      const {
        socket,
        incomingCall,
        callAccepted,
        currentCallUser,
        callData,
        stopSounds,
      } = callContext;

      const isVideoCall = Boolean(callData?.video ?? incomingCall?.video);

    

      const {
        myVideo,
        userVideo,
        userAudio,
        peerRef,
        startedRef,
        originalCameraStreamRef,
        localStreamRef,
        signalAppliedRef,
        callIdRef,
      } = refs;

      const {
        setCallStarted,
        setConnectionStatus,
        setRemoteCameraOff,
        setNetworkQuality,
      } = setters;

      useEffect(() => {
        return () => {
          if (peerRef.current) {
            peerRef.current.destroy();
          }

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
          }
        };
      }, [peerRef, localStreamRef]);

      useEffect(() => {
        if (!callAccepted || startedRef.current || !user || !currentCallUser)
          return;

        startedRef.current = true;

        if (!incomingCall && !callData) return;

        let handleAccepted;
        const start = async () => {
          stopSounds();

          if (callIdRef.current ) return;

          const callRes = await axios.post("/api/calls", {
            caller: user._id,
            receiver: currentCallUser._id,
            type: isVideoCall ? "video" : "audio",
          });
          console.log("isVideoCall =", isVideoCall);
          console.log("callData =", callData);
          console.log("incomingCall =", incomingCall);

          callIdRef.current = callRes.data._id;

          if (peerRef.current) return;

          console.log("callData:", callData);
          console.log("incomingCall:", incomingCall);
          console.log("video demandé:", callData?.video);
          console.log("video reçu:", incomingCall?.video);

          const wantsVideo = callData?.video || incomingCall?.video;

          const stream = await navigator.mediaDevices.getUserMedia({
            video: wantsVideo
              ? {
                  facingMode: state.facingMode,
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30, max: 30 },
                  resizeMode: "crop-and-scale",
                }
              : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
              sampleRate: 48000,
            },
          });

          stream.getTracks().forEach((track) => {
            track.enabled = true;
          });

          const videoTrack = stream.getVideoTracks()[0];

          if (videoTrack) {
            videoTrack.contentHint = "motion";
          }

          const audioTrack = stream.getAudioTracks()[0];

          if (audioTrack) {
            audioTrack.contentHint = "speech";
          }

          console.log("LOCAL VIDEO TRACKS:", stream.getVideoTracks());

          originalCameraStreamRef.current = stream;
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
              iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
              ],
            },
          });

          peerRef.current = peer;

          stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
          });

          peer.on("connect", () => {
            setNetworkQuality("Excellent");
          });

          peer.on("error", (err) => {
            console.log("PEER ERROR:", err);
          });

          peer.on("close", () => {
            setNetworkQuality("Connexion perdue");
          });

          peer.on("signal", (data) => {
            if (incomingCall) {
              socket.emit("acceptCall", {
                signal: data,
                to: incomingCall.from,
              });
              return;
            }

            if (!currentCallUser?._id) return;

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
          });

          peer.on("stream", (remoteStream) => {
            console.log("TRACKS AUDIO:", remoteStream.getAudioTracks());
            console.log("TRACKS VIDEO:", remoteStream.getVideoTracks());

            setConnectionStatus("En appel");
            setCallStarted(true);
            setRemoteCameraOff(false);

            if (
              localStreamRef.current &&
              remoteStream.id === localStreamRef.current.id
            )
              return;

            // ================= VIDEO =================
            if (userVideo.current && remoteStream.getVideoTracks().length > 0) {
              userVideo.current.srcObject = remoteStream;
              userVideo.current.muted = false;
              userVideo.current.volume = 1;

              userVideo.current
                .play()
                .then(() => {
                  console.log("VIDEO + AUDIO PLAYING");
                })
                .catch((err) => {
                  console.log("VIDEO PLAY ERROR:", err);
                });
            }

            // ================= AUDIO =================
            console.log("userAudio.current =", userAudio.current);

            if (userAudio.current) {
              console.log("ENTRÉ DANS LE BLOC AUDIO");
              userAudio.current.srcObject = remoteStream;
              userAudio.current.autoplay = true;
              userAudio.current.muted = false;
              userAudio.current.volume = 1;

              const playAudio = async () => {
                try {
                  userAudio.current.srcObject = remoteStream;

                  await userAudio.current.play();
                  console.log("🔊 AUDIO PLAYING");
                } catch (err) {
                  console.log("❌ AUDIO ERROR:", err);

                  // fallback important
                  setTimeout(() => {
                    userAudio.current?.play().catch(() => {});
                  }, 500);
                }
              };

              playAudio();
            }
            console.log("AUDIO TRACKS:", remoteStream.getAudioTracks());
          });
          let answerApplied = false;

          handleAccepted = (signal) => {
            if (answerApplied) return;

            answerApplied = true;
            peer.signal(signal);
          };

          socket.off("callAccepted");
          socket.on("callAccepted", handleAccepted);

          if (incomingCall && !signalAppliedRef.current) {
            signalAppliedRef.current = true;
            peer.signal(incomingCall.signal);
          }
        };

        start().catch((err) => {
          console.log("START ERROR:", err);
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
        localStreamRef,
        myVideo,
        originalCameraStreamRef,
        peerRef,
        setCallStarted,
        setConnectionStatus,
        setNetworkQuality,
        setRemoteCameraOff,
        signalAppliedRef,
        socket,
        startedRef,
        state.facingMode,
        stopSounds,
        user,
        userVideo,
        userAudio,
        isVideoCall,
        callIdRef,
      ]);

      useEffect(() => {
        let interval;

        if (state.callStarted) {
          interval = setInterval(() => {
            setters.setCallDuration((prev) => prev + 1);
          }, 1000);
        }

        return () => clearInterval(interval);
      }, [state.callStarted, setters]);
    };

export default useCallWebrtc;


















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

  return (
    <CallUI
      refs={refs}
      state={state}
      currentCallUser={currentCallUser}
      isVideoCall={isVideoCall}
      formatDuration={formatDuration}
      controls={controls}
      dragHandlers={dragHandlers}
    />
  );
};

export default CallComponent;