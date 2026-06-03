import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../auth/AuthContext";
import CommentSection from "../components/CommentSection";

const ArticleDetail = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [article, setArticle] = useState(null);

  // 🔥 REF POUR SCROLL
  const commentsRef = useRef(null);

  // 🔥 LOAD ARTICLE
  useEffect(() => {
    fetch(`http://localhost:5000/api/articles/${id}`)
      .then((res) => res.json())
      .then((data) => setArticle(data));
  }, [id]);

  // 🔥 SCROLL AUTOMATIQUE
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scroll = params.get("scroll");

    if (scroll === "comments") {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [location]);

  if (!article) return <p>Chargement...</p>;

  // 🖼️ IMAGE FIX
  const image = article.media?.[0];
  const imageUrl = image?.startsWith("http")
    ? image
    : `http://localhost:5000/${image}`;

  return (
    <div className="article-detail">
      {/* 🧾 INFOS */}
      <h2>{article.title}</h2>

      {image && (
        <img
          src={imageUrl}
          alt={article.title}
          className="article-detail-image"
        />
      )}

      <p className="price">💰 {article.price} MAD</p>

      <p>{article.description}</p>

      <p className="location">📍 {article.location || "Non précisé"}</p>

      <p>👤 {article.author?.name}</p>

      {/* 🔘 ACTIONS */}
      <div className="detail-actions">
        <button
          className="contact-btn"
          onClick={() => {
            console.log("GO TO CHAT:", article.author?._id);
            navigate(`/messages/${article.author._id}`);
          }}
        >
          Contacter vendeur
        </button>

        <button
          className="buy-btn"
          onClick={() => navigate(`/checkout/${article._id}`)}
        >
          🛒 Acheter
        </button>
      </div>

      {/* 💬 COMMENTAIRES */}
      <div ref={commentsRef}>
        <CommentSection articleId={article._id} token={token} />
      </div>
    </div>
  );
};

export default ArticleDetail;
