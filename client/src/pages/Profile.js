import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ArticleCard from "../components/ArticleCard";

const Profile = () => {
  const { user, token, setUser } = useAuth();

  const [myArticles, setMyArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [file, setFile] = useState(null);

  // 🔥 upload image
  const handleUpload = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const res = await fetch(
        "http://localhost:5000/api/users/profile-picture",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();

      // 🔥 update user dans context
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 Mes articles
  useEffect(() => {
    const fetchMyArticles = async () => {
      const res = await fetch("http://localhost:5000/api/articles/my-article", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyArticles(data);
    };

    if (token) fetchMyArticles();
  }, [token]);

  // 🔥 Favoris
  useEffect(() => {
    const fetchFavorites = async () => {
      const res = await fetch("http://localhost:5000/api/articles/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFavorites(data);
    };

    if (token) fetchFavorites();
  }, [token]);

  return (
    <div className="profile">
      {/* 👤 PROFILE HEADER */}
      <div className="profile-header">
        <img
          src={
            user?.profilePicture
              ? `http://localhost:5000${user.profilePicture}`
              : "https://ui-avatars.com/api/?name=User"
          }
          alt="profile"
          className="profile-avatar"
        />

        <h2>{user?.name}</h2>
        <p>{user?.email}</p>

        {/* 🔥 UPLOAD */}
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <button onClick={handleUpload}>📸 Changer la photo</button>
      </div>

      {/* 📦 MES ARTICLES */}
      <div className="profile-section">
        <h3>Mes articles</h3>

        <div className="articles-grid">
          {myArticles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      </div>

      {/* ❤️ FAVORIS */}
      <div className="profile-section">
        <h3>Mes favoris</h3>

        <div className="articles-grid">
          {favorites.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
