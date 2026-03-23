import React, { useState } from "react";
import { updateArticle } from "../../services/ArticleService";

const ArticleEditForm = ({ article, onCancel, onUpdated }) => {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await updateArticle(article._id, { title, content }, token);
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Modifier l'article</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button type="submit">Enregistrer</button>
      <button type="button" onClick={onCancel}>
        Annuler
      </button>
    </form>
  );
};

export default ArticleEditForm;
