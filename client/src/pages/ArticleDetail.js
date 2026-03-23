// src/pages/ArticleDetail.js
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../auth/AuthContext";
import CommentSection from "../components/Comments/CommentSection";

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const { token, user } = useContext(AuthContext); // On garde user, on l'utilise plus bas

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`/api/articles/${id}`);
        setArticle(res.data);
      } catch (err) {
        console.error("Erreur chargement article :", err);
      }
    };

    fetchArticle();
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await axios.post(
        `/api/articles/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArticle(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du like");
    }
  };

  if (!article) return <p>Chargement...</p>;

  return (
    <div>
      <h2>{article.title}</h2>
      <p>{article.content}</p>

      {/* ✅ Affichage des images / vidéos */}
      {article.media && article.media.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          {article.media.map((file, index) => (
            <div key={index} style={{ marginBottom: "1rem" }}>
              {file.endsWith(".mp4") || file.endsWith(".webm") ? (
                <video
                  src={`http://localhost:5000/${file}`}
                  controls
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <img
                  src={`http://localhost:5000/${file}`}
                  alt={`media-${index}`}
                  style={{
                    maxWidth: "300px",
                    maxHeight: "300px",
                    height: "auto",
                    display: "block",
                    marginTop: "0.5rem",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <p>
        Auteur : {article.author?.email || "Inconnu"} <br />
        Statut : {article.buyer ? "Déjà acheté" : "Disponible"}
      </p>

      {/* Likes */}
      <p>❤️ {article.likes?.length || 0} likes</p>
      {token && <button onClick={handleLike}>❤️ Liker</button>}

      {/* Bouton d’achat */}
      {!article.buyer && token && (
        <button onClick={() => navigate(`/checkout/${article._id}`)}>
          🛒 Acheter
        </button>
      )}

      {/* Affichage de l'utilisateur connecté */}
      {user && (
        <p className="text-sm text-gray-500">
          Connecté en tant que : {user.username || user.email}
        </p>
      )}

      <CommentSection articleId={article._id} />
    </div>
  );
};

export default ArticleDetail;
