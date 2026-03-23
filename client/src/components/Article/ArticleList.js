// src/components/Article/ArticleList.jsx
import { useEffect, useState } from "react";
import { getAllArticles, deleteArticle } from "../../services/ArticleService"; // ⚠️ assure-toi que deleteArticle est bien importé
import ArticleEditForm from "./ArticleEditForm";

const ArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);

  const fetchArticles = async () => {
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch (error) {
      console.error("Erreur lors du chargement des articles", error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // 🧩 Ajout de handleDelete ici
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      await deleteArticle(id, token);
      fetchArticles(); // Recharger la liste après suppression
    } catch (error) {
      console.error("Erreur lors de la suppression", error);
    }
  };

  const handleEditClick = (id) => {
    setEditingArticleId(id);
  };

  const handleCancelEdit = () => {
    setEditingArticleId(null);
  };

  const handleUpdated = () => {
    setEditingArticleId(null);
    fetchArticles();
  };

  return (
    <div>
      <h2>Liste des articles</h2>
      {articles.length === 0 ? (
        <p>Aucun article trouvé.</p>
      ) : (
        <ul>
          {articles.map((article) => (
            <li key={article._id}>
              {editingArticleId === article._id ? (
                <ArticleEditForm
                  article={article}
                  onCancel={handleCancelEdit}
                  onUpdated={handleUpdated}
                />
              ) : (
                <>
                  {/* ✅ Afficher l'image si elle existe */}
                  {article.media && article.media.length > 0 && (
                    <div
                      style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                    >
                      {article.media.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${article.title}-${i}`}
                          style={{
                            width: "200px",
                            height: "auto",
                            borderRadius: "8px",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <h3>{article.title}</h3>
                  <p>{article.content}</p>
                  <p>
                    <em>
                      Publié par : {article.author?.email || "Inconnu"} –{" "}
                      {new Date(article.createdAt).toLocaleString()}
                    </em>
                  </p>
                  <button onClick={() => handleEditClick(article._id)}>
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(article._id)}>
                    Supprimer
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArticleList;