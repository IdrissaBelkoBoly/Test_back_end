import Comment from "../models/CommentModel.js";
import ArticleModel from "../models/ArticleModel.js";
import NotificationModel from "../models/NotificationModel.js";


export const createComment = async (req, res) => {
  try {
    console.log("🔥 Route POST /api/comments appelée");
    const { articleId, content, parentId = null } = req.body;
    console.log("📝 Données reçues :", { articleId, content, parentId });

    const senderName = req.user.username || req.user.name || "Utilisateur";

    // 1️⃣ Création du commentaire
    const comment = new Comment({
      articleId,
      content,
      parentId,
      author: req.user._id,
    });

    const savedComment = await comment.save();

    // 2️⃣ On récupère l'instance Socket.IO
    const io = req.app.get("io");

    // 3️⃣ Notification si c’est une réponse à un commentaire
    if (parentId) {
      const parentComment = await Comment.findById(parentId).populate("author");

      if (
        parentComment &&
        parentComment.author._id.toString() !== req.user._id.toString()
      ) {
        const notif = new NotificationModel({
          user: parentComment.author._id, // celui qui reçoit
          sender: req.user._id, // celui qui envoie
          type: "reply",
          commentId: savedComment._id,
          articleId,
          message: `${senderName} a répondu à votre commentaire.`,
        });

        await notif.save();

        // Envoi en temps réel
        io.to(String(parentComment.author._id)).emit("newNotification", {
          type: "reply",
          message: `${senderName} a répondu à votre commentaire.`,
          articleId,
          commentId: savedComment._id,
        });
      }
    }
    // 4️⃣ Sinon notification au créateur de l'article
    else {
      const article = await ArticleModel.findById(articleId).populate("author");

      if (
        article &&
        article.author._id.toString() !== req.user._id.toString()
      ) {
        const notif = new NotificationModel({
          user: article.author._id,
          sender: req.user._id,
          type: "comment",
          commentId: savedComment._id,
          articleId,
          message: `${senderName} a commenté votre article.`,
        });

        await notif.save();

        io.to(String(article.author._id)).emit("newNotification", {
          type: "comment",
          message: `${senderName} a commenté votre article.`,
          articleId,
          commentId: savedComment._id,
        });
      }
    }

    // 5️⃣ On lie le commentaire à l'article
    await ArticleModel.findByIdAndUpdate(articleId, {
      $push: { comments: savedComment._id },
    });

    res.status(201).json({
      ...savedComment.toObject(),
      parentId: parentId || null,
    });
  } catch (error) {
    console.error("❌ Erreur createComment :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🔥 Nouveau : récupérer un commentaire spécifique
export const getSingleComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author", "email")
      .populate("articleId", "title");
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getCommentsByArticle = async (req, res) => {
  try {
    const comments = await Comment.find({ articleId: req.params.articleId })
      .populate({path:"author", select:"username email"})
      .sort({ createdAt: 1 }) // plus anciens en premier pour un ordre logique
      .lean();

    // Construire un arbre de commentaires
    const map = {};
    const roots = [];

    comments.forEach((comment) => {
      comment.replies = [];
      if(!comment.author){
        comment.author = { username: "utilisateur inconnu", email: "inconny@example.com"};
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
    console.error("Erreur getCommentsByArticle:", err);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des commentaires" });
  }
};

export const getUserCommentedArticles = async (req, res) => {
  try {
    const userId = req.user._id;

    const comments = await CommentModel.find({ author: userId }).select(
      "articleId"
    );
    const articleIds = [...new Set(comments.map((c) => c.articleId))];

    const articles = await ArticleModel.find({
      _id: { $in: articleIds },
    }).populate("author", "email");

    res.status(200).json(articles);
  } catch (error) {
    console.error("Erreur getUserCommentedArticles :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
