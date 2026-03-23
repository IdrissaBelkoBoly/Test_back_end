import ArticleModel from '../models/ArticleModel.js';

// créer un article
export const createArticle = async (req, res) => {
  try {
    console.log("Fichier reçu :", req.files); // Ajoute ça tout en haut de createArticle

    const { title, content, price } = req.body;

    if (!title || !content || !price) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const media = req.files
      ? req.files.map((file) => `uploads/articles/${file.filename}`)
      : [];

    const newArticle = new ArticleModel({
      title,
      content,
      price,
      author: req.user._id,
      media,
    });

    const savedArticle = await newArticle.save();
    res
      .status(201)
      .json({ message: "Article créé avec succès", article: savedArticle });
  } catch (error) {
    console.error("Erreur lors de la création de l'article :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Obtenir tous les articles
export const getArticles = async (req, res) => {
  try {
    const articles = await ArticleModel.find({ isSold: false })
      .populate("author", "email name")
      .sort({ createdAt: -1 })
      .lean();

    articles.forEach((article) => {
      if (article.media) {
        if (Array.isArray(article.media)) {
          // Si c'est déjà un tableau
          article.media = article.media.map(
            (m) => `${req.protocol}://${req.get("host")}/${m}`
          );
        } else {
          // Si c'est une seule string → on l’entoure dans un tableau
          article.media = [`${req.protocol}://${req.get("host")}/${article.media}`];
        }
      } else {
        // Si aucun media → on force un tableau vide
        article.media = [];
      }
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



//Acheter un article 
export const acheterArticle = async (req, res) => {
  try {
    const articleId = req.params.id;

    const article = await ArticleModel.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    if (article.isSold) {
      return res.status(400).json({ message: "Article déjà vendu" });
    }

    article.isSold = true;
    article.buyer = req.user._id;
    await article.save();

    res.status(200).json({ message: "Article acheté avec succès", article });
  } catch (error) {
    console.error("Erreur lors de l'achat :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//Nouvelle version Restful pour acheter
export const buyArticle = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }
    if (article.isSold) {
      return res.status(400).json({ message: "Article déjà vendu" });
    }

    article.buyer = req.user._id;
    article.isSold = true;
    await article.save();

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Like / Dislike un article
export const likeArticle = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    const userId = req.user._id.toString();
    if (!article.likes) article.likes = [];

    const index = article.likes.findIndex(id => id.toString() === userId);

    if (index !== -1) {
      // Déjà liké, on retire
      article.likes.splice(index, 1);
    } else {
      // Pas encore liké, on ajoute
      article.likes.push(userId);
    }

    await article.save();
    res.status(200).json(article);
  } catch (error) {
    console.error("Erreur lors du like :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// Supprimer un article
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ArticleModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    res.status(200).json({ message: "Article supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
  // mettre a jour un article
  
export const updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const { title, content } = req.body;

    // Trouver l'article par ID et mettre à jour les champs title et content
    const updatedArticle = await ArticleModel.findByIdAndUpdate(
      articleId,
      { title, content },
      { new: true } // renvoyer l'article mis à jour
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    res.status(200).json(updatedArticle);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getArticlesByUser = async (req, res) => {
  try {
    const articles = await ArticleModel.find({ author: req.user._id })
  .populate("likes")
  .populate({
    path: "comments",
    populate: {
      path: "author",
      select: "email name", // 👤 On récupère nom + email du commentateur
    },
  })
    res.status(200).json(articles);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des articles de l'utilisateur :",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getLikedArticles = async (req, res) => {
  try {
    const userId = req.user._id;
    const articles = await ArticleModel.find({ likes: userId }).populate(
      "author",
      "email"
    );
    res.status(200).json(articles);
  } catch (error) {
    console.error("Erreur getLikedArticles :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Nouveau : récupérer un seul article avec ses commentaires
export const getArticleById = async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id)
      .populate("author", "email name")
      .populate({
        path: "comments",
        populate: { path: "author", select: "email" },
      });

    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    res.status(200).json(article);
  } catch (error) {
    console.error("Erreur getArticleById :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};





