import Notification from "../models/NotificationModel.js"; // importe ton modèle Mongoose

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("sender", "username email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/*export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await NotificationModel.countDocuments({
      user: req.user._id,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};*/

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Erreur getUnreadCount:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.status(200).json({ message: "Notification marquée comme lue", notification });
  } catch (error) {
    console.error("Erreur markNotificationAsRead:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
