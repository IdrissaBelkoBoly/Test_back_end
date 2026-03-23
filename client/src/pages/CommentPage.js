// src/pages/CommentPage.js
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import AuthContext from "../auth/AuthContext";

const CommentPage = () => {
  const { articleId } = useParams();
  const { user } = useContext(AuthContext);

  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // Récupération article + commentaires
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resArticle = await fetch(
          `http://localhost:5000/api/articles/${articleId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setArticle(await resArticle.json());

        const resComments = await fetch(
          `http://localhost:5000/api/comments/${articleId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setComments(await resComments.json());
      } catch (err) {
        console.error("Erreur chargement commentaires :", err);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [articleId, user?.token]);

  // Envoi commentaire ou réponse
  const handleReply = async (parentId) => {
    if (!content.trim()) return;

    try {
      await fetch("http://localhost:5000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ articleId, content, parentId }),
      });

      // Rafraîchir les commentaires après ajout
      const resComments = await fetch(
        `http://localhost:5000/api/comments/${articleId}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setComments(await resComments.json());
    } catch (err) {
      console.error("Erreur ajout commentaire :", err);
    }

    setContent("");
    setReplyTo(null);
  };

  // Affichage récursif des commentaires
  const renderComment = (comment) => (
    <div key={comment._id} className="mb-4 border p-3 rounded bg-white">
      <p className="text-sm text-gray-600 font-semibold">
        {comment.author.username || comment.author.email}
      </p>
      <p className="mb-1">{comment.content}</p>
      <button
        onClick={() => setReplyTo(comment._id)}
        className="text-blue-500 text-xs"
      >
        Répondre
      </button>

      {replyTo === comment._id && (
        <div className="mt-2">
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Votre réponse..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={() => handleReply(comment._id)}
            className="mt-1 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Envoyer
          </button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="ml-6 mt-3 space-y-2 border-l pl-3">
          {comment.replies.map((reply) => renderComment(reply))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4">
      {article && (
        <div className="border p-4 rounded mb-4 bg-gray-100">
          <h2 className="text-xl font-bold">{article.title}</h2>
          <p>{article.content}</p>
        </div>
      )}

      <h3 className="text-lg font-bold mb-3">💬 Commentaires</h3>

      {/* Formulaire commentaire principal */}
      <div className="mb-4">
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Ajouter un commentaire..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={() => handleReply(null)}
          className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
        >
          Publier
        </button>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => renderComment(comment))}
      </div>
    </div>
  );
};

export default CommentPage;
