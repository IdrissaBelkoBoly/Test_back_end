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

    console.log("callIdRef =", callIdRef.current);

    if (callIdRef.current) {
      console.log("ENVOI UPDATE");

      const res = await axios.put(`/api/calls/${callIdRef.current}`, {
        status: "ended",
        duration: callDuration,
      });

      console.log("UPDATE OK", res.data);

      callIdRef.current = null;
    } else {
      console.log("AUCUN CALL ID");
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
