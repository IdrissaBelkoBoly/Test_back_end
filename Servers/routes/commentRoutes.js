import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createComment,
  getCommentsByArticle,
  getSingleComment,
  getUserCommentedArticles,
} from "../controllers/CommentController.js";

const router = express.Router();

// Créer un commentaire ou une réponse
router.post("/", authMiddleware, createComment);

// Obtenir tous les commentaires d’un article
router.get("/:articleId", getCommentsByArticle);

router.get("/single/:id", getSingleComment);

router.get("/commented" , authMiddleware , getUserCommentedArticles);

export default router;
