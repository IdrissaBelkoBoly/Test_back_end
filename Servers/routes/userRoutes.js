import express from "express";
import User from "../models/UserModel.js";

const router = express.Router(); // ✅ Majuscule

import {
  newUser,
  loginUser,
  deleteUser,
  getAllUsers,
  getMe,
  getUserArticles,
  getUserPurchases
} from "../controllers/UserController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

// 🔐 Route protégée de test (profil)
router.get("/profile", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Voici ton profil !",
    user: req.user,
  });
});

router.put(
  "/profile-picture",
  authMiddleware,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const profilePicturePath = `/uploads/profile_pictures/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePicture: profilePicturePath },
        { new: true }
      );

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour." });
    }
  }
);

// Inscription
router.post("/register", newUser);

// Connexion
router.post("/login", loginUser);

// Suppression
router.delete("/:id", deleteUser); // ou tu peux utiliser POST si tu préfères

// Nouvelle route pour récuperer tous les utilisateurs 
router.get("/",getAllUsers);

// Utilisateurs
router.get("/", getAllUsers);
router.get("/me", authMiddleware, getMe); // besoin du token
router.get("/:id/articles", getUserArticles);
router.get("/:id/purchases", getUserPurchases);


export default router;
