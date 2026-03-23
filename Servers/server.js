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




// middleware de gestion des errers 
app.use(errorHandler);

// --------------- SOCKET.IO ---------------
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io); // pour avoir accès à io dans les routes

io.on("connection", (socket) => {
  console.log("🔌 Utilisateur connecté :", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId); // chaque user rejoint sa propre salle
    console.log(`👤 Utilisateur ${userId} a rejoint sa salle`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Utilisateur déconnecté :", socket.id);
  });
});

// 7️⃣ Lancement du serveur
server.listen(PORT, () => {
console.log(`🚀 Serveur lancé avec Socket.io sur http://localhost:${PORT}`);
});
