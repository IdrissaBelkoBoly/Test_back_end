import express from "express";
import articleUpload from "../middleware/articleUpload.js";
import Article from "../models/ArticleModel.js";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createArticle,
  getArticles,
  deleteArticle,
  updateArticle,
  getArticlesByUser,
  likeArticle,
  buyArticle,
  getLikedArticles,
  getArticleById,
} from "../controllers/ArticleController.js";

const router = express.Router();

// =========================
// 🔹 ROUTES SPÉCIFIQUES
// =========================

// Articles de l'utilisateur connecté
router.get("/my-article", authMiddleware, getArticlesByUser);

// Articles likés
router.get("/liked", authMiddleware, getLikedArticles);

// Favoris ❤️
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const user = await req.user.populate("favorites");
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Articles achetés
router.get("/my-purchases", authMiddleware, async (req, res) => {
  try {
    const articles = await Article.find({ buyer: req.user._id })
      .populate("author", "name email")
      .sort({ updatedAt: -1 });

    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Confirmations paiement
router.get("/my-confirmations", authMiddleware, async (req, res) => {
  try {
    const confirmedArticles = await Article.find({
      buyer: req.user._id,
      transferStatus: "validated",
    })
      .populate("author", "name email")
      .sort({ updatedAt: -1 });

    res.json(confirmedArticles);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Transferts reçus
router.get("/my-transfers", authMiddleware, async (req, res) => {
  try {
    const transfers = await Article.find({
      author: req.user._id,
      transferNumber: { $exists: true },
    }).sort({ updatedAt: -1 });

    res.json(transfers);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// =========================
// 🔹 ROUTES STANDARD
// =========================

// Créer un article
router.post(
  "/",
  authMiddleware,
  articleUpload.array("media", 5),
  createArticle,
);

// Obtenir tous les articles
router.get("/", getArticles);

// Like / Unlike ❤️
router.post("/:id/like", authMiddleware, likeArticle);

// Favoris ⭐
router.post("/:id/favorite", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const articleId = req.params.id;

    const index = user.favorites.findIndex(
      (fav) => fav.toString() === articleId,
    );

    if (index === -1) {
      user.favorites.push(articleId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();

    res.json({
      message: "Favoris mis à jour",
      favorites: user.favorites,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Acheter un article
router.put("/:id/buy", authMiddleware, buyArticle);

// Modifier un article
router.put("/:id", authMiddleware, updateArticle);

// Supprimer un article
router.delete("/:id", deleteArticle);

// =========================
// 🔹 TRANSFERT / PAIEMENT
// =========================

// Envoyer numéro transfert
router.put("/:id/send-transfer", authMiddleware, async (req, res) => {
  const { transferNumber } = req.body;

  if (!transferNumber) {
    return res.status(400).json({ message: "Numéro requis" });
  }

  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Introuvable" });
    }

    article.transferNumber = transferNumber;
    article.transferStatus = "pending";
    article.buyer = req.user._id;

    await article.save();

    res.json({ message: "Transfert envoyé", article });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Valider paiement
router.put("/:id/validate-transfer", authMiddleware, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Introuvable" });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    article.transferStatus = "validated";
    await article.save();

    // Notification temps réel
    const io = req.app.get("io");
    if (article.buyer) {
      io.to(article.buyer.toString()).emit("transferValidated", article);
    }

    res.json({ message: "Paiement validé", article });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// =========================
// 🔴 TOUJOURS À LA FIN
// =========================

router.get("/:id", getArticleById);

export default router;
