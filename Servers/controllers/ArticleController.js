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
    const { search, category, minPrice, maxPrice, location, sort } = req.query;

    let query = { isSold: false };
    let usedFallback = false;
    let words = [];

    // 🔍 SEARCH
    if (search && search.trim() !== "") {
      words = search.trim().split(" ");

      query.$or = words.flatMap((word) => [
        { title: { $regex: word, $options: "i" } },
        { description: { $regex: word, $options: "i" } },
        { content: { $regex: word, $options: "i" } },
      ]);
    }

    // 🏷️ CATEGORY
    if (category && category !== "all") {
      query.category = category;
    }

    // 💰 PRICE
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 📍 LOCATION
    if (location && location.trim() !== "") {
      query.location = { $regex: location, $options: "i" };
    }

    // 📊 SORT
    let sortOption = { createdAt: -1 };
    if (sort === "priceAsc") sortOption = { price: 1 };
    if (sort === "priceDesc") sortOption = { price: -1 };

    console.log("🔥 QUERY =", query);

    // ✅ SEARCH NORMAL
    let articles = await ArticleModel.find(query)
      .populate("author", "name")
      .populate("comments")
      .sort(sortOption)
      .lean();

    // 🔥 FALLBACK
    if (articles.length === 0 && search) {
      console.log("⚠️ Aucun résultat → fallback activé");

      usedFallback = true;

      const relaxedQuery = {
        isSold: false,
        $or: words.flatMap((word) => [
          { title: { $regex: word, $options: "i" } },
          { description: { $regex: word, $options: "i" } },
          { content: { $regex: word, $options: "i" } },
        ]),
      };

      articles = await ArticleModel.find(relaxedQuery)
        .populate("author", "name")
        .sort(sortOption)
        .lean();
    }

    // 🔥 FIX MEDIA
    articles.forEach((article) => {
      if (article.media) {
        article.media = Array.isArray(article.media)
          ? article.media.map(
              (m) => `${req.protocol}://${req.get("host")}/${m}`,
            )
          : [`${req.protocol}://${req.get("host")}/${article.media}`];
      } else {
        article.media = [];
      }
    });

    res.json({
      articles,
      fallback: usedFallback,
    });
  } catch (error) {
    console.error(error);
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
      })
      .lean(); // 🔥 IMPORTANT

    if (!article) {
      return res.status(404).json({ message: "Introuvable" });
    }

    // 👁️ incrémenter vues
    await ArticleModel.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 },
    });

    // 🔥 FIX IMAGE / MEDIA
    if (article.media) {
      if (Array.isArray(article.media)) {
        article.media = article.media.map(
          (m) => `${req.protocol}://${req.get("host")}/${m}`,
        );
      } else {
        article.media = [
          `${req.protocol}://${req.get("host")}/${article.media}`,
        ];
      }
    } else {
      article.media = [];
    }

    res.json(article);
  } catch (error) {
    console.error("Erreur getArticleById :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
