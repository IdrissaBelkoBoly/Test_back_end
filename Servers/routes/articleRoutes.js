import express from "express";
import articleUpload from "../middleware/articleUpload.js";
import Article from "../models/ArticleModel.js";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createArticle,
  getArticles,
  acheterArticle,
  deleteArticle,
  updateArticle,
  getArticlesByUser,
  likeArticle,
  buyArticle,
  getLikedArticles,
  getArticleById,
} from "../controllers/ArticleController.js";

const router = express.Router();

// 🔹 Routes spécifiques (avant les routes dynamiques)

// Récupérer les articles de l'utilisateur connecté
router.get("/my-article", authMiddleware, getArticlesByUser);

// Récupérer les articles likés
router.get("/liked", authMiddleware, getLikedArticles);

// Voir les transferts reçus par le vendeur
router.get("/my-transfers", authMiddleware, async (req, res) => {
  try {
    const transfers = await Article.find({
      author: req.user._id,
      transferNumber: { $exists: true },
    }).sort({ updatedAt: -1 });

    res.json(transfers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Routes standard

// Créer un article
router.post(
  "/",
  authMiddleware,
  articleUpload.array("media", 5),
  createArticle
);

// Obtenir tous les articles
router.get("/", getArticles);

// Acheter un article
router.post("/:id/acheter", authMiddleware, acheterArticle);

// Version RESTful pour acheter
router.put("/:id/buy", authMiddleware, buyArticle);

// Liker / Disliker un article
router.post("/:id/like", authMiddleware, likeArticle);

// Supprimer un article
router.delete("/:id", deleteArticle);

// Modifier un article
router.put("/:id", authMiddleware, updateArticle);

// Envoyer le numéro de transfert pour un article acheté
router.put("/:id/send-transfer", authMiddleware, async (req, res) => {
  const { transferNumber } = req.body;
  const articleId = req.params.id;

  if (!transferNumber) {
    return res.status(400).json({ message: "Numéro de transfert requis" });
  }

  try {
    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ message: "Article introuvable" });
    }

    article.transferNumber = transferNumber;
    article.transferStatus = "pending";
    article.buyer = req.user._id;

    await article.save();

    res.json({ message: "Numéro de transfert envoyé avec succès", article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Valider un paiement par le vendeur
router.put("/:id/validate-transfer", authMiddleware, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article introuvable" });
    }

    // Vérifier que c’est bien le vendeur qui valide
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (!article.transferNumber) {
      return res.status(400).json({ message: "Aucun transfert en attente" });
    }

    article.transferStatus = "validated";
    await article.save();

    // ⚡ Notification en temps réel à l’acheteur
    const io = req.app.get("io");
    if (article.buyer) {
      io.to(article.buyer.toString()).emit("transferValidated", article);
      console.log(`🔔 Notification envoyée à l'acheteur ${article.buyer}`);
    }

    res.json({ message: "Paiement validé avec succès", article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Voir les articles achetés par l'utilisateur connecté
router.get("/my-purchases", authMiddleware, async (req, res) => {
  try {
    const articles = await Article.find({ buyer: req.user._id })
      .populate("author", "name email")
      .sort({ updatedAt: -1 });

    const result = articles.map((article) => ({
      _id: article._id,
      title: article.title,
      price: article.price,
      transferNumber: article.transferNumber,
      transferStatus: article.transferStatus,
      author: article.author,
      media: article.media,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Voir les confirmations de paiement validées (pour l’acheteur)
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
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// Récupérer un seul article (toujours à la fin)
router.get("/:id", getArticleById);

export default router;
