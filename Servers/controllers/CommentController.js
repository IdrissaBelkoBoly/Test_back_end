import Comment from "../models/CommentModel.js";
import ArticleModel from "../models/ArticleModel.js";
import NotificationModel from "../models/NotificationModel.js";

// =========================
// ✍️ CRÉER COMMENTAIRE
// =========================
export const createComment = async (req, res) => {
  try {
    const { articleId, content, parentId = null } = req.body;

    // ✅ Vérification des champs
    if (!articleId || !content) {
      return res.status(400).json({ message: "Champs requis" });
    }

    // ✅ Vérifier que l'article existe
    const article = await ArticleModel.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article introuvable" });
    }

    const senderName = req.user.username || req.user.name || "Utilisateur";

    // 1️⃣ Création du commentaire
    const comment = new Comment({
      articleId,
      content,
      parentId,
      author: req.user._id,
    });

    const savedComment = await comment.save();

    const io = req.app.get("io");

    // =========================
    // 🔔 NOTIFICATION RÉPONSE
    // =========================
    if (parentId) {
      const parentComment = await Comment.findById(parentId).populate("author");

      if (
        parentComment &&
        parentComment.author._id.toString() !== req.user._id.toString()
      ) {
        const notif = new NotificationModel({
          user: parentComment.author._id,
          sender: req.user._id,
          type: "reply",
          commentId: savedComment._id,
          articleId,
          message: `${senderName} a répondu à votre commentaire.`,
        });

        await notif.save();

        io.to(String(parentComment.author._id)).emit("newNotification", {
          type: "reply",
          message: `${senderName} a répondu à votre commentaire.`,
          articleId,
          commentId: savedComment._id,
        });
      }
    }

    // =========================
    // 🔔 NOTIFICATION ARTICLE
    // =========================
    else {
      const fullArticle =
        await ArticleModel.findById(articleId).populate("author");

      if (
        fullArticle &&
        fullArticle.author._id.toString() !== req.user._id.toString()
      ) {
        const notif = new NotificationModel({
          user: fullArticle.author._id,
          sender: req.user._id,
          type: "comment",
          commentId: savedComment._id,
          articleId,
          message: `${senderName} a commenté votre article.`,
        });

        await notif.save();

        io.to(String(fullArticle.author._id)).emit("newNotification", {
          type: "comment",
          message: `${senderName} a commenté votre article.`,
          articleId,
          commentId: savedComment._id,
        });
      }
    }

    // =========================
    // 🔗 LIER AU ARTICLE
    // =========================
    await ArticleModel.findByIdAndUpdate(articleId, {
      $push: { comments: savedComment._id },
    });

    // ✅ Retour optimisé pour frontend
    const populatedComment = await Comment.findById(savedComment._id).populate(
      "author",
      "name email",
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Erreur createComment :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 📄 UN SEUL COMMENTAIRE
// =========================
export const getSingleComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author", "email name")
      .populate("articleId", "title");

    if (!comment) {
      return res.status(404).json({ message: "Commentaire introuvable" });
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 💬 COMMENTAIRES PAR ARTICLE
// =========================
export const getCommentsByArticle = async (req, res) => {
  try {
    const comments = await Comment.find({ articleId: req.params.articleId })
      .populate({ path: "author", select: "name email" })
      .sort({ createdAt: 1 })
      .lean();

    const map = {};
    const roots = [];

    comments.forEach((comment) => {
      comment.replies = [];

      if (!comment.author) {
        comment.author = {
          name: "Utilisateur inconnu",
          email: "inconnu@example.com",
        };
      }

      map[comment._id] = comment;
    });

    comments.forEach((comment) => {
      if (comment.parentId) {
        if (map[comment.parentId]) {
          map[comment.parentId].replies.push(comment);
        }
      } else {
        roots.push(comment);
      }
    });

    res.json(roots);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 👤 ARTICLES COMMENTÉS PAR USER
// =========================
export const getUserCommentedArticles = async (req, res) => {
  try {
    const userId = req.user._id;

    const comments = await Comment.find({ author: userId }).select("articleId");

    const articleIds = [...new Set(comments.map((c) => c.articleId))];

    const articles = await ArticleModel.find({
      _id: { $in: articleIds },
    }).populate("author", "name email");

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
