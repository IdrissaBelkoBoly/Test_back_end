import React from "react";
import { useNavigate } from "react-router-dom";

const ArticleCard = ({ article, onLike }) => {
  const navigate = useNavigate();

  const image = article.media?.[0];
  const imageUrl = image?.startsWith("http")
    ? image
    : `http://localhost:5000/${image}`;

  return (
    <div className="article-card">
      {/* 🖼️ IMAGE */}
      <div className="image-container">
        {image && (
          <img
            src={imageUrl}
            alt={article.title}
            className="article-image"
            onClick={() => navigate(`/article/${article._id}`)}
          />
        )}
      </div>

      {/* 📄 CONTENT */}
      <div className="article-content">
        <h3>{article.title}</h3>

        <p className="description">{article.description || article.content}</p>

        <p className="price">{article.price} MAD</p>

        <p className="author">👤 {article.author?.name || "Utilisateur"}</p>
      </div>

      {/* 🔘 ACTIONS */}
      <div className="article-actions">
        {/* ❤️ LIKE */}
        <button onClick={() => onLike(article._id)}>
          ❤️ {article.likes?.length || 0}
        </button>

        {/* 💬 COMMENT (scroll vers commentaires) */}
        <button
          onClick={() => navigate(`/article/${article._id}?scroll=comments`)}
        >
          💬 {article.comments?.length|| 0}
        </button>

        {/* 👁️ DETAIL */}
        <button onClick={() => navigate(`/article/${article._id}`)}>👁️</button>
      </div>
    </div>
  );
};

export default ArticleCard;
