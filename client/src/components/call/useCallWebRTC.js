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

      if (!incomingCall) {
        if (callIdRef.current) return;

        const callRes = await axios.post("/api/calls", {
          caller: user._id,
          receiver: currentCallUser._id,
          type: isVideoCall ? "video" : "audio",
        });

        callIdRef.current = callRes.data._id;
        console.log("CALL ID ENREGISTRÉ:", callIdRef.current);
      }

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
          callId: callIdRef.current,
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
