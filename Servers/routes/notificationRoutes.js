import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔔 Toutes les notifications
router.get("/", authMiddleware, getNotifications);

// 🔢 Nombre non lues
router.get("/unread-count", authMiddleware, getUnreadCount);

// ✅ Marquer comme lu
router.patch("/:id/read", authMiddleware, markNotificationAsRead);

export default router;
