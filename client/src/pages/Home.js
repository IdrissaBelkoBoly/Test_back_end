// src/pages/Home.js
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../auth/AuthContext";
import { getAllArticles, likeArticle } from "../services/ArticleService";

const Home = () => {
  const { user, token } = useContext(AuthContext);
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await getAllArticles();

        // ✅ filtrer les articles sauf ceux de l'utilisateur
        const filtered = response.filter(
          (article) => article.author._id !== user.id
        );

        // ✅ Toujours forcer media à être un tableau
        const normalized = filtered.map((article) => ({
          ...article,
          media: Array.isArray(article.media)
            ? article.media
            : article.media
            ? [article.media]
            : [],
        }));

        setArticles(normalized);
      } catch (error) {
        console.error("Erreur lors du chargement des articles :", error);
      }
    };

    if (user) {
      fetchArticles();
    }
  }, [user]);

  const handleLike = async (id) => {
    try {
      const updatedArticle = await likeArticle(id, token);

      setArticles((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...updatedArticle,
                media: Array.isArray(updatedArticle.media)
                  ? updatedArticle.media
                  : updatedArticle.media
                  ? [updatedArticle.media]
                  : [],
              }
            : a
        )
      );
    } catch (err) {
      console.error("Erreur lors du like :", err);
    }
  };

  const handlePurchase = (id) => {
    navigate(`/checkout/${id}`);
  };

  return (
    <div classeName="home-container">
      <h2>Articles des autres utilisateurs</h2>
      {articles.length === 0 ? (
        <p>Aucun article à afficher.</p>
      ) : (
        <ul className="article-list">
          {articles.map((article) => (
            <li key={article._id} className="article-card">
              {/* ✅ Boucle sur tous les fichiers du tableau media */}
              {article.media.length > 0 && (
                <div className="article-media">
                  {article.media.map((file, index) => (
                    <div key={index}>
                      {file.endsWith(".mp4") || file.endsWith(".webm") ? (
                        <video src={file} controls />
                      ) : (
                        <img src={file} alt={`media-${index}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h3>{article.title}</h3>
              <p>{article.content}</p>
              <p>Posté par : {article.author.name}</p>

              <div className="article-actions">
                <button onClick={() => handleLike(article._id)}>
                  ❤️ J'aime
                </button>
                <button onClick={() => navigate(`/article/${article._id}`)}>
                  💬 Commenter
                </button>
                <button onClick={() => handlePurchase(article._id)}>
                  🛒 Acheter
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;
