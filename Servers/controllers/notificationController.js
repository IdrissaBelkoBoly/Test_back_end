import Notification from "../models/NotificationModel.js";

// =========================
// 🔔 RÉCUPÉRER LES NOTIFICATIONS
// =========================
export const getNotifications = async (req, res) => {
  try {
    // ✅ Sécurité
    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    const notifications = await Notification.find({
      user: req.user._id,
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Erreur getNotifications:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 🔢 NOMBRE NON LUES
// =========================
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Erreur getUnreadCount:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// ✅ MARQUER UNE COMME LUE
// =========================
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.json({
      message: "Notification marquée comme lue",
      notification,
    });
  } catch (error) {
    console.error("Erreur markNotificationAsRead:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 🔥 MARQUER TOUT COMME LU
// =========================
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true },
    );

    res.json({ message: "Toutes les notifications sont lues" });
  } catch (error) {
    console.error("Erreur markAllAsRead:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
