import React, {
  useEffect,
  useState,
  useContext,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../auth/AuthContext";
import EmojiPicker from "emoji-picker-react";
import {
  FiFile,
  FiMapPin,
  FiMic,
  FiVideo,
  FiCamera,
  FiCheck,
  FiSquare,
  FiSend,
} from "react-icons/fi";
import CallContext from "../context/CallContext";
import socket from "../socket";

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, token, loading } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [seller, setSeller] = useState(null);

  const [recording, setRecording] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiInput, setShowEmojiInput] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [showPicker, setShowPicker] = useState(null); // null = aucun picker ouvert

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { setCallData } = useContext(CallContext);


  // 🔥 FOCUS INPUT
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 🔥 LOAD DATA
  useEffect(() => {
    if (!user?._id || !token) return;

    const loadAll = async () => {
      try {
        let targetId = userId;

        // 🔥 si pas de userId → dernière conversation
        if (!targetId) {
          const resAll = await fetch(
            `http://localhost:5000/api/messages/${user._id}`,
          );
          const allMessages = await resAll.json();

          if (allMessages.length > 0) {
            const lastMsg = allMessages[allMessages.length - 1];

            targetId =
              lastMsg.sender._id === user._id
                ? lastMsg.receiver._id
                : lastMsg.sender._id;

            navigate(`/messages/${targetId}`);
          } else return;
        }

        // 📩 messages
        const resMsg = await fetch(
          `http://localhost:5000/api/messages/${user._id}/${targetId}`,
        );
        const msgData = await resMsg.json();
        setMessages(msgData);

        // 👤 vendeur
        const resSeller = await fetch(
          `http://localhost:5000/api/users/${targetId}`,
        );
        const sellerData = await resSeller.json();
        setSeller(sellerData);
      } catch (err) {
        console.error(err);
      }
    };

    loadAll();
  }, [user, token, userId, navigate]);

  useEffect(() => {
    if (!user?._id || !token) return;

    const targetId = userId || seller?._id;

    if (!targetId) return;

    fetch(`http://localhost:5000/api/messages/seen/${targetId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [user, userId, seller, token]);

  // 🔥 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 SOCKET TEMPS RÉEL
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join", user._id);

    // 🔹 Chat en temps réel
    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    return () => {
      socket.off("receiveMessage");
      socket.off("onlineUsers");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [user]);

  // 🔥 SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim()) return;
    if (!user?._id || !token) return;

    try {
      await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender: user._id,
          receiver: userId,
          content: text,
        }),
      });

      setText("");

      // reload
      const resMsg = await fetch(
        `http://localhost:5000/api/messages/${user._id}/${userId}`,
      );
      const msgData = await resMsg.json();
      setMessages(msgData);
    } catch (error) {
      console.error(error);
    }
  };

  const sendLocation = async () => {
    if (!navigator.geolocation) {
      return alert(
        "La géolocalisation n'est pas supportée par votre navigateur.",
      );
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch("http://localhost:5000/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sender: user._id,
            receiver: userId,
            type: "location", // indique au backend que c'est une localisation
            location: { latitude, longitude },
          }),
        });

        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error("Erreur envoi localisation:", error);
      }
    });
  };

  // 🎤 START RECORD
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("receiver", userId || seller?._id);

      console.log("📤 ENVOI AUDIO");
      console.log("receiver:", userId || seller?._id);

      await fetch("http://localhost:5000/api/messages/audio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // reload
      const resMsg = await fetch(
        `http://localhost:5000/api/messages/${user._id}/${userId}`,
      );
      const msgData = await resMsg.json();
      setMessages(msgData);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  // 🎤 STOP
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const reactToMessage = async (messageId, emoji) => {
    const res = await fetch(
      `http://localhost:5000/api/messages/${messageId}/react`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      },
    );

    const updated = await res.json();

    setMessages((prev) =>
      prev.map((m) => (m._id === updated._id ? updated : m)),
    );
  };

  // Fonctions pour gérer les uploads
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("receiver", userId || seller?._id);

    try {
      const res = await fetch("http://localhost:5000/api/messages/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);
    formData.append("receiver", userId || seller?._id);

    try {
      const res = await fetch("http://localhost:5000/api/messages/video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiver", userId || seller?._id);

    try {
      const res = await fetch("http://localhost:5000/api/messages/file", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="messages-container">
      {/* HEADER */}
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={
              seller?.profilePicture
                ? `http://localhost:5000${seller.profilePicture}`
                : `https://ui-avatars.com/api/?name=${seller?.name}`
            }
            alt="avatar"
            className="chat-avatar"
          />
          <div className="chat-info">
            <h3>{seller?.name}</h3>
            <p>
              {onlineUsers.includes(userId) ? "🟢 En ligne" : "⚫ Hors ligne"}
            </p>
          </div>
        </div>

        <div className="chat-actions">
          <button onClick={() => setCallData({ user: seller, video: true })}>
            📹
          </button>

          <button onClick={() => setCallData({ user: seller, video: false })}>
            📞
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messages-list">
        {isTyping && (
          <p style={{ fontSize: "12px", color: "gray" }}>
            ✍️ en train d’écrire...
          </p>
        )}

        {messages.map((m) => {
          const isMe = m.sender?._id === user?._id;

          return (
            <div key={m._id} className={`message-row ${isMe ? "me" : "other"}`}>
              {!isMe && (
                <img
                  src={
                    m.sender?.profilePicture
                      ? `http://localhost:5000${m.sender.profilePicture}`
                      : `https://ui-avatars.com/api/?name=${m.sender?.name}`
                  }
                  alt=""
                  className="message-avatar"
                />
              )}

              <div className={`message-bubble ${isMe ? "me" : "other"}`}>
                {/* TEXTE */}
                {m.content && <p className="message-text">{m.content}</p>}

                {/* AUDIO */}
                {m.audio && (
                  <div className="media-wrapper">
                    <audio controls>
                      <source
                        src={`http://localhost:5000${m.audio}`}
                        type="audio/webm"
                      />
                      Votre navigateur ne supporte pas l'audio
                    </audio>
                  </div>
                )}

                {/* IMAGE */}
                {m.image && (
                  <div className="media-wrapper">
                    <img
                      src={`http://localhost:5000${m.image}`}
                      alt="message"
                      style={{
                        maxWidth: "200px",
                        borderRadius: "8px",
                        marginTop: "5px",
                      }}
                    />
                  </div>
                )}

                {/* VIDEO */}
                {m.video && (
                  <div className="media-wrapper">
                    <video controls width="200">
                      <source src={`http://localhost:5000${m.video}`} />
                    </video>
                  </div>
                )}

                {/* FICHIER */}
                {m.file && (
                  <div className="media-wrapper">
                    <a href={`http://localhost:5000${m.file}`} download>
                      <FiFile /> Télécharger fichier
                    </a>
                  </div>
                )}

                {/* LOCATION */}
                {m.type === "location" && m.location && (
                  <div className="media-wrapper location">
                    <a
                      href={`https://www.google.com/maps?q=${m.location.latitude},${m.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "5px 8px",
                        background: "#d1e7ff",
                        borderRadius: "6px",
                        marginTop: "5px",
                        textDecoration: "none",
                        color: "#000",
                      }}
                    >
                      <FiMapPin /> Voir la position
                    </a>
                  </div>
                )}

                {/* BOUTON EMOJI POUR CHAQUE MESSAGE */}
                <button onClick={() => setShowPicker(m._id)}>😄</button>

                {/* PICKER EMOJI */}
                {showPicker === m._id && (
                  <div style={{ position: "absolute", zIndex: 10 }}>
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        reactToMessage(m._id, emojiData.emoji);
                        setShowPicker(null);
                      }}
                    />
                  </div>
                )}

                {/* REACTIONS */}
                <div className="reactions">
                  {m.reactions?.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#eee",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        marginRight: "3px",
                      }}
                    >
                      {r.emoji}
                    </span>
                  ))}
                </div>

                {/* HEURE + SEEN */}
                <div className="message-meta">
                  <span className="message-time">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && (
                    <span className="message-check">
                      {m.seen ? (
                        <FiCheck />
                      ) : (
                        <FiCheck style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="message-input" style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            socket.emit("typing", { sender: user._id, receiver: userId });

            setTimeout(() => {
              socket.emit("stopTyping", { sender: user._id, receiver: userId });
            }, 1000);
          }}
          placeholder="Écrire un message..."
        />

        {/* BOUTON EMOJI */}
        <button onClick={() => setShowEmojiInput(!showEmojiInput)}>😄</button>

        {/* BOUTON ENVOYER */}
        <button onClick={sendMessage}>
          {" "}
          <FiSend />{" "}
        </button>

        {/* BOUTON LOCALISATION */}
        <button onClick={sendLocation}>
          {" "}
          <FiMapPin />{" "}
        </button>

        {/* PICKER EMOJI GLOBAL */}
        {showEmojiInput && (
          <div style={{ position: "absolute", bottom: "60px", zIndex: 10 }}>
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setText((prev) => prev + emojiData.emoji);
              }}
            />
          </div>
        )}

        {/* MENU ➕ */}
        <div className="more-options-container">
          <button onClick={() => setShowMore(!showMore)}>➕</button>

          {showMore && (
            <div
              className="more-options-popup"
              style={{
                position: "absolute",
                bottom: "50px",
                right: "0",
                background: "#fff",
                padding: "10px",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                zIndex: 10,
              }}
            >
              <button onClick={() => imageInputRef.current.click()}>
                <FiCamera />
              </button>
              <button onClick={() => videoInputRef.current.click()}>
                <FiVideo />
              </button>
              <button onClick={() => fileInputRef.current.click()}>
                <FiFile />
              </button>
              {!recording ? (
                <button onClick={startRecording}>
                  {" "}
                  <FiMic />{" "}
                </button>
              ) : (
                <button onClick={stopRecording}>
                  {" "}
                  <FiSquare />{" "}
                </button>
              )}
            </div>
          )}
        </div>

        {/* INPUTS CACHÉS POUR UPLOAD */}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={imageInputRef}
          onChange={handleImageUpload}
        />
        <input
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          ref={videoInputRef}
          onChange={handleVideoUpload}
        />
        <input
          type="file"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};;;;;;;;;
      
export default Messages;
