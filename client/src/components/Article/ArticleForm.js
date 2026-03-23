// src/components/Article/ArticleForm.jsx
import React, { useState } from "react";
import { createArticle } from "../../services/ArticleService";

const ArticleForm = ({ onArticleCreated }) => {
  const [titre, setTitre] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("title", titre);
      formData.append("content", content);
      formData.append("price", price);

      // 🔥 ajouter plusieurs fichiers
      files.forEach((file) => {
        formData.append("media", file);
      });

      await createArticle(formData, token);
      setTitre("");
      setContent("");
      setPrice("");
      setFiles([]);
      if (onArticleCreated) onArticleCreated();
    } catch (error) {
      console.error("Erreur lors de la création de l'article", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer un article</h2>
      <div>
        <label>Titre :</label>
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Content :</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <label>Prix:</label>
      <input
      type="number"
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      required
    />

  {/* 🔥 Champ pour plusieurs fichiers */}
  <div>
    <label>Images / vidéos :</label>
    <input
      type="file"
      multiple
      onChange={(e) => setFiles(Array.from(e.target.files))}
    />
  </div>

  {/* ✅ Prévisualisation */}
  {files.length > 0 && (
    <div style={{ marginTop: "1rem" }}>
      {files.map((file, i) => (
        <p key={i}>{file.name}</p>
      ))}
    </div>
    )}
      <button type="submit">Créer</button>
    </form>
  );
};

export default ArticleForm;
