import express from "express";
import { getNotifications, getUnreadCount, markNotificationAsRead } from "../controllers/notificationController.js";
import verifyToken  from "../middleware/authMiddleware.js";
//import { getUnreadNotificationCount } from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router();

router.get("/", verifyToken, getNotifications);
//router.get("/unread-count", authMiddleware, getUnreadNotificationCount);
router.get("/unread-count" , authMiddleware , getUnreadCount);
router.patch("/:id/read", verifyToken, markNotificationAsRead);

export default router;
