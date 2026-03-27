import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createComment,
  getCommentsByArticle,
  getSingleComment,
  getUserCommentedArticles,
} from "../controllers/CommentController.js";

const router = express.Router();

// Créer commentaire
router.post("/", authMiddleware, createComment);

// IMPORTANT : ordre
router.get("/single/:id", getSingleComment);

// Articles commentés par user
router.get("/commented", authMiddleware, getUserCommentedArticles);

// Tous les commentaires d’un article
router.get("/:articleId", getCommentsByArticle);

export default router;
