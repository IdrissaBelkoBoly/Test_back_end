import express from "express";
import uploadAudio from "../middleware/uploadAudio.js";
import Message from "../models/MessageModel.js";
import authMiddleware from "../middleware/authMiddleware.js";
import uploadImage from "../middleware/uploadImage.js"; 
import uploadFile from "../middleware/uploadFile.js"; // nouveau middleware
import uploadVideo from "../middleware/uploadVideo.js";
import {
  sendMessage,
  getMessages,
  sendAudioMessage,
} from "../controllers/messageController.js";

const router = express.Router();

// 📩 envoyer message
router.post("/", authMiddleware , sendMessage);

// 📥 récupérer tous les messages d’un user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name profilePicture")
      .populate("receiver", "name profilePicture")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📥 récupérer conversation
router.get("/:user1/:user2", getMessages);

router.post("/audio",authMiddleware, uploadAudio.single("audio"), sendAudioMessage);

router.put("/seen/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        seen: false,
      },
      { seen: true },
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur seen" });
  }
});

// 📤 ENVOYER IMAGE
router.post(
  "/image",
  authMiddleware,
  uploadImage.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Pas de fichier image" });
      }

      const imagePath = `/uploads/messages/${req.file.filename}`;

      const message = await Message.create({
        sender: req.user._id,
        receiver: req.body.receiver,
        image: imagePath,
        type: "image",
      });

      // 🔥 SOCKET TEMPS RÉEL
      const io = req.app.get("io");
      io.to(req.body.receiver).emit("receiveMessage", message);

      res.json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur upload image" });
    }
  }
);


router.put("/:id/react", authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message non trouvé" });
    }

    // vérifier si user a déjà réagi
    const existing = message.reactions.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (existing) {
      existing.emoji = emoji; // update emoji
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    // 🔥 socket
    const io = req.app.get("io");
    io.emit("messageReaction", message);

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur réaction" });
  }
});

// 🔹 ENVOYER VIDEO
router.post(
  "/video",
  authMiddleware,
  uploadVideo.single("video"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Pas de vidéo" });

      const videoPath = `/uploads/videos/${req.file.filename}`;

      const message = await Message.create({
        sender: req.user._id,
        receiver: req.body.receiver,
        video: videoPath,
        type: "video",
      });

      const io = req.app.get("io");
      io.to(req.body.receiver).emit("receiveMessage", message);

      res.json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur upload vidéo" });
    }
  },
);

// 🔹 ENVOYER FICHIER
router.post(
  "/file",
  authMiddleware,
  uploadFile.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Pas de fichier" });

      const filePath = `/uploads/files/${req.file.filename}`;

      const message = await Message.create({
        sender: req.user._id,
        receiver: req.body.receiver,
        file: filePath,
        type: "file",
      });

      const io = req.app.get("io");
      io.to(req.body.receiver).emit("receiveMessage", message);

      res.json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur upload fichier" });
    }
  },
);


// 📍 ENVOYER LOCALISATION
router.post("/location", authMiddleware, async (req, res) => {
  try {
    const { receiver, latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude et longitude requises" });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      location: { latitude, longitude },
      type: "location",
    });

    // 🔥 SOCKET TEMPS RÉEL
    const io = req.app.get("io");
    io.to(receiver).emit("receiveMessage", message);

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur envoi localisation" });
  }
});

export default router;
