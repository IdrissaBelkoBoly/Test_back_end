// importation des modules nécéssaires 
import express from 'express';
//import mongoose from 'mongoose';
import dotenv from 'dotenv';


import cors from 'cors';
import connectDB from './config/db.js';
import path  from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import paymentRoutes from "./routes/paymentRoutes.js"


//importer les middleware 
import errorHandler from './middleware/errorMiddleware.js';

// configuration 
dotenv.config();
const app = express();
const PORT = process.env.PORT||5000 ;

// Résoudre __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// les middlewares 
app.use(cors({origin: ["http://localhost:3000" , "http://localhost:3001"] ,credentials: true}));
app.use(express.json());


//connexion à la base de donnée 

connectDB();


// routes 
import userRoutes from './routes/userRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import authRoutes from './routes/authRoutes.js';
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import callRoutes from"./routes/callRoutes.js";




// Pour servir les images (photo de profil)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/articles",
  express.static(path.join(__dirname, "uploads/articles"))
);

app.use('/api/auth', authRoutes);
app.use('/api/users',userRoutes);
app.use('/api/articles',articleRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications" , notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calls", callRoutes);




// middleware de gestion des errers 
app.use(errorHandler);

// --------------- SOCKET.IO ---------------
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);




// 🔥 USERS MAP
const onlineUsers = new Map();
const usersStatus = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Utilisateur connecté :", socket.id);

  // =========================
  // 🔥 JOIN USER
  // =========================
  socket.on("join", (userId) => {
    console.log("✅ JOIN BACKEND:", userId);
    socket.join(userId);

    onlineUsers.set(userId, socket.id);

    usersStatus.set(userId, {
      online: true,
      inCall: false,
    });

    console.log(`👤 ${userId} connecté`);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    io.emit("usersStatus", Object.fromEntries(usersStatus));
  });

  // =========================
  // ✍️ TYPING
  // =========================
  socket.on("typing", ({ sender, receiver }) => {
    socket.to(receiver).emit("typing", sender);
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    socket.to(receiver).emit("stopTyping", sender);
  });

  // =========================
  // 📞 CALL USER
  // =========================
  socket.on("callUser", ({ userToCall, signalData, from, video, fromUser }) => {
    console.log("📞 BACKEND callUser reçu :", {
      userToCall,
      from,
      video,
    });
    console.log("📞 callUser vers:", userToCall);
    console.log("📞 online:", Array.from(onlineUsers.keys()));

    usersStatus.set(from, {
      ...usersStatus.get(from),
      inCall: true,
    });

    io.emit("usersStatus", Object.fromEntries(usersStatus));

    // ✅ envoi via ROOM (userId)
    io.to(userToCall).emit("receiveCall", {
      from,
      signal: signalData,
      video,
      fromUser,
    });

    console.log("📤 EMIT vers ROOM:", userToCall);
  });

  // =========================
  // 📞 ACCEPT CALL
  // =========================
  socket.on("acceptCall", ({ signal, to }) => {
   io.to(to).emit("callAccepted", signal);
  });

socket.on("toggleMute", ({ to, muted }) => {
  io.to(to).emit("remoteMuteChanged", {
    muted,
  });
});

socket.on("toggleCamera", ({ to, cameraOff }) => {
  io.to(to).emit("remoteCameraChanged", {
    cameraOff,
  });
});

  // =========================
  // 📴 END CALL
  // =========================
  socket.on("endCall", ({ to, from }) => {
    console.log("📴 END CALL BACKEND", { to, from });

    // 🔥 remettre les statuts à false
    if (from && usersStatus.has(from)) {
      usersStatus.set(from, {
        ...usersStatus.get(from),
        inCall: false,
      });
    }

    if (to && usersStatus.has(to)) {
      usersStatus.set(to, {
        ...usersStatus.get(to),
        inCall: false,
      });
    }

    io.emit("usersStatus", Object.fromEntries(usersStatus));

    // 🔥 envoyer à TOUT LE MONDE concerné
    if (to) io.to(to).emit("callEnded");
    if (from) io.to(from).emit("callEnded");
  });

  // =========================
  // ❌ DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        usersStatus.delete(userId);

        console.log(`❌ ${userId} déconnecté`);
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    io.emit("usersStatus", Object.fromEntries(usersStatus));
  });
});

// 7️⃣ Lancement du serveur
server.listen(PORT, () => {
console.log(`🚀 Serveur lancé avec Socket.io sur http://localhost:${PORT}`);
});






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
