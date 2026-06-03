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
