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
