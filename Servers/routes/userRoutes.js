import express from "express";
import User from "../models/UserModel.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

import {
  newUser,
  loginUser,
  deleteUser,
  getAllUsers,
  getMe,
  getUserArticles,
  getUserPurchases,
} from "../controllers/UserController.js";

const router = express.Router();

// =========================
// 🔐 AUTH
// =========================
router.post("/register", newUser);
router.post("/login", loginUser);

// =========================
// 👤 PROFIL
// =========================

// Profil connecté
router.get("/me", authMiddleware, getMe);

// Supprimer compte
router.delete("/me", authMiddleware, deleteUser);

// Modifier photo profil
router.put(
  "/profile-picture",
  authMiddleware,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const profilePicturePath = `/uploads/profile_pictures/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: profilePicturePath },
        { new: true },
      );

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// =========================
// 📊 USERS
// =========================

// (optionnel → admin seulement plus tard)
router.get("/", authMiddleware, getAllUsers);

// Articles d’un user
router.get("/:id/articles", getUserArticles);

// Achats d’un user
router.get("/:id/purchases", getUserPurchases);

export default router;
