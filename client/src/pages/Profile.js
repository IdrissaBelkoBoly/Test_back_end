import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../auth/AuthContext";
import { getMyArticles, deleteArticle } from "../services/ArticleService";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, token, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [myArticles, setMyArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("");
  const [media, setMedia] = useState([]); // ✅ tableau pour gérer plusieurs fichiers

  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    const fetchMyArticles = async () => {
      try {
        const articles = await getMyArticles(token); // ✅ utilise token du context
        setMyArticles(articles);
      } catch (error) {
        console.error("Erreur lors du chargement de mes articles :", error);
      }
    };

    if (token) {
      fetchMyArticles();
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet article ?")) {
      try {
        await deleteArticle(id, token); // ✅ utilise token du context
        setMyArticles((prev) => prev.filter((a) => a._id !== id));
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
      }
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/profile-picture",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`, // ✅ corrigé
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Erreur HTTP " + response.status);

      const data = await response.json();

      setUser((prev) => {
        const updated = { ...prev, profilePicture: data.profilePicture };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });

      alert("Photo de profil mise à jour !");
    } catch (err) {
      console.error("Erreur lors du changement de photo :", err);
      alert("Erreur lors du changement de la photo de profil.");
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("price", price);

      // ✅ Ajout multiple fichiers
      if (media.length > 0) {
        media.forEach((file) => {
          formData.append("media", file);
        });
      }

      const response = await fetch("http://localhost:5000/api/articles", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.article) {
        setMyArticles((prev) => [data.article, ...prev]);
      }

      setTitle("");
      setContent("");
      setPrice("");
      setMedia([]);

      alert("Article publié !");
    } catch (err) {
      console.error("Erreur lors de la publication :", err);
    }
  };

  const handleEdit = (article) => {
    setEditingArticleId(article._id);
    setEditedTitle(article.title);
    setEditedContent(article.content);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/api/articles/${editingArticleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: editedTitle, content: editedContent }),
        }
      );

      const updatedArticle = await response.json();
      setMyArticles((prev) =>
        prev.map((a) => (a._id === updatedArticle._id ? updatedArticle : a))
      );
      setEditingArticleId(null);
      alert("Article modifié !");
    } catch (err) {
      console.error("Erreur lors de la modification :", err);
    }
  };

  const totalLikes = myArticles.reduce(
    (sum, a) => sum + (Array.isArray(a.likes) ? a.likes.length : 0),
    0
  );

  return (
    <div className= "profile-container">
      <h2>👤 Mon Profil</h2>

      <div className="profile-info">
        {user.profilePicture ? (
          <img
            src={`http://localhost:5000/${user.profilePicture}`} // ✅ ajout du prefix
            alt="Profil"
            
          />
        ) : (
          <div
           className="profile-placholder"
          >
            ?
          </div>
        )}
        <label>
          📷 Changer la photo :
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            
          />
        </label>
      </div>

      <div
       className="profile-details"
      >
        <p>
          <strong>Nom :</strong> {user.name}
        </p>
        <p>
          <strong>Email :</strong> {user.email}
        </p>
        <p>
          <strong>Nombre d'articles publiés :</strong> {myArticles.length}
        </p>
        <p>
          <strong>Total de likes :</strong> {totalLikes}
        </p>
      </div>

      <h3>➕ Publier un article</h3>
      <form onSubmit={handlePublish} style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Titre de l'article"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Contenu de l'article"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
        />
        <input
          type="number"
          placeholder="Prix en €"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => setMedia(Array.from(e.target.files))} // ✅ on stocke la FileList
        />
        <button type="submit">📤 Publier</button>
      </form>

      <h3>📝 Mes Articles</h3>
      {myArticles.length === 0 ? (
        <p>Vous n'avez publié aucun article.</p>
      ) : (
        <ul className="articles-list">
          {myArticles.map((article) => (
            <li key={article._id} style={{ marginBottom: "2rem" }}>
              {editingArticleId === article._id ? (
                <form onSubmit={handleUpdate}>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                  />
                  <textarea
                    rows={4}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <button type="submit">💾 Enregistrer</button>
                  <button
                    type="button"
                    onClick={() => setEditingArticleId(null)}
                  >
                    ❌ Annuler
                  </button>
                </form>
              ) : (
                <>
                  <h4>{article.title}</h4>
                  <p>{article.content}</p>
                  <p>
                    <strong>Prix :</strong> {article.price} €
                  </p>
                  <p>
                    <strong>État :</strong>{" "}
                    {article.isSold ? "✅ Vendu" : "🟢 Disponible"}
                  </p>

                  {article.media && article.media.length > 0 && (
                    <div className="article-media">
                      {article.media.map((file, index) => (
                        <div key={index} style={{ marginBottom: "1rem" }}>
                          {file.endsWith(".mp4") || file.endsWith(".webm") ? (
                            <video
                              src={`http://localhost:5000/${file}`}
                              controls
                            
                            />
                          ) : (
                            <img
                              src={`http://localhost:5000/${file}`}
                              alt={`media-${index}`}
                             
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p>❤️ {article.likes?.length || 0} like(s)</p>
                  <div className="article-action">
                  <button
                  className="comments"
                    onClick={() => navigate(`/comments/${article._id}`)}
                   
                  >
                    Voir les commentaires
                  </button>
                    <button
                     className="edit"
                      onClick={() => handleEdit(article)}
                      
                    >
                      ✏️ Modifier
                    </button>
                    <button className="delete" onClick={() => handleDelete(article._id)}>
                      🗑️ Supprimer
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Profile;
