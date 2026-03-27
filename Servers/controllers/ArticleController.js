import ArticleModel from "../models/ArticleModel.js";

// =========================
// ✅ CRÉER ARTICLE
// =========================
export const createArticle = async (req, res) => {
  try {
    const { title, description, price, category, location } = req.body;

    if (!title || !description || !price) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const media = req.files
      ? req.files.map((file) => `uploads/articles/${file.filename}`)
      : [];

    const newArticle = new ArticleModel({
      title,
      description,
      price,
      category,
      location,
      author: req.user._id,
      media,
    });

    const savedArticle = await newArticle.save();

    res.status(201).json(savedArticle);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 🔍 GET ARTICLES (FILTER + SEARCH)
// =========================
export const getArticles = async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = { isSold: false };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const articles = await ArticleModel.find(filter)
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    articles.forEach((article) => {
      article.media =
        article.media?.map(
          (m) => `${req.protocol}://${req.get("host")}/${m}`,
        ) || [];
    });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 🛒 ACHETER ARTICLE
// =========================
export const buyArticle = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    if (article.isSold) {
      return res.status(400).json({ message: "Déjà vendu" });
    }

    article.buyer = req.user._id;
    article.isSold = true;

    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// ❤️ LIKE / UNLIKE
// =========================
export const likeArticle = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    const userId = req.user._id.toString();

    const index = article.likes.findIndex((id) => id.toString() === userId);

    if (index !== -1) {
      article.likes.splice(index, 1);
    } else {
      article.likes.push(userId);
    }

    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 🔒 DELETE ARTICLE (SECURE)
// =========================
export const deleteArticle = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Introuvable" });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    await article.deleteOne();

    res.json({ message: "Supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 🔒 UPDATE ARTICLE
// =========================
export const updateArticle = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Introuvable" });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const { title, description, price, category, location } = req.body;

    article.title = title || article.title;
    article.description = description || article.description;
    article.price = price || article.price;
    article.category = category || article.category;
    article.location = location || article.location;

    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 👤 ARTICLES USER
// =========================
export const getArticlesByUser = async (req, res) => {
  try {
    const articles = await ArticleModel.find({ author: req.user._id })
      .populate("likes")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name email" },
      });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// ❤️ ARTICLES LIKÉS
// =========================
export const getLikedArticles = async (req, res) => {
  try {
    const articles = await ArticleModel.find({
      likes: req.user._id,
    }).populate("author", "name");

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =========================
// 📄 ARTICLE DETAIL + 👁️ VIEWS
// =========================
export const getArticleById = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id)
      .populate("author", "name profilePicture")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name email" },
      });

    if (!article) {
      return res.status(404).json({ message: "Introuvable" });
    }

    // 👁️ incrémenter vues
    article.views += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
