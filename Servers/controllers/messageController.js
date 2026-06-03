import Message from "../models/MessageModel.js";
import Notification from "../models/NotificationModel.js";

// 📩 ENVOYER MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, content , type, location } = req.body;

    const message = await Message.create({
      sender,
      receiver,
      content: content || "",
      type: type || "text",
      location: location || null,
    });

    // 🔔 AJOUT NOTIFICATION
    await Notification.create({
      user: receiver,
      sender: sender,
      type: "message",
      message: `${req.user.name} t’a envoyé un message`,
      messageId: message._id,
    });

    // 🔥 SOCKET TEMPS RÉEL
    const io = req.app.get("io");
    io.to(receiver).emit("receiveMessage", message);

    // 🔔 notification temps réel
    io.to(receiver).emit("newNotification", {
      type: "message",
      message: "Nouveau message",
    });

    res.json(message);
  } catch (error) {
    console.error("❌ ERREUR BACKEND:", error); // 🔥 AJOUTE ÇA
    res.status(500).json({ message: "Erreur envoi message" });
  }
};

// 📥 GET CONVERSATION
export const getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name")
      .populate("receiver", "name");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération messages" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .populate("sender", "name profilePicture")
      .populate("receiver", "name profilePicture")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const sendAudioMessage = async (req, res) => {
  try {
       
    console.log("📥 AUDIO REÇU");

    console.log("FILE:", req.file);
    console.log("BODY:", req.body);
    console.log("USER:", req.user);


    if (!req.file) {
      return res.status(400).json({ message: "Pas de fichier audio" });
    }

    const audioPath = `/uploads/audio/${req.file.filename}`;

    const message = await Message.create({
      sender: req.user._id, // 🔥 sécurisé
      receiver: req.body.receiver,
      audio: audioPath,
      type: "audio",
    });

    // 🔥 SOCKET TEMPS RÉEL
    const io = req.app.get("io");
    io.to(req.body.receiver).emit("receiveMessage", message);

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur audio" });
  }
};