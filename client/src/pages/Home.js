import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../auth/AuthContext";
import { likeArticle } from "../services/ArticleService";
import ArticleCard from "../components/ArticleCard";

const Home = () => {
  const { user, token } = useContext(AuthContext);

  const [articles, setArticles] = useState([]);
  const [isFallback, setIsFallback] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    location: "",
    sort: "newest",
  });


  // ⚡ recherche auto (debounce)
 useEffect(() => {
   const fetchArticles = async () => {
     try {
       console.log("🔥 Recherche avec :", filters);

       const query = new URLSearchParams(filters).toString();
       const res = await fetch(`http://localhost:5000/api/articles?${query}`);
       const data = await res.json();

       console.log("✅ RESULT =", data);

       const list = data.articles || data;

       const filtered = user
         ? list.filter((article) => article.author._id !== user.id)
         : list;

       setArticles(filtered);
       setIsFallback(data.fallback || false);

       setSuggestions(list.slice(0, 5).map((a) => a.title));
     } catch (error) {
       console.error(error);
     }
   };

   const delay = setTimeout(() => {
     fetchArticles();
   }, 500); // debounce

   return () => clearTimeout(delay);
 }, [filters, user]);

 const handleChange = (e) => {
   setFilters({ ...filters, [e.target.name]: e.target.value });
 };
 const handleLike = async (id) => {
   try {
     const updated = await likeArticle(id, token);
     setArticles((prev) => prev.map((a) => (a._id === id ? updated : a)));
   } catch (err) {
     console.error(err);
   }
 };

  return (
    <div className="home-container">
      {/* 🔍 SEARCH */}
      <div className="search-bar">
        <input
          type="text"
          name="search"
          placeholder="🔍 Rechercher un produit..."
          value={filters.search}
          onChange={handleChange}
        />
      </div>

      {/* 🔍 SUGGESTIONS */}
      {suggestions.length > 0 && filters.search && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <p key={i} onClick={() => setFilters({ ...filters, search: s })}>
              {s}
            </p>
          ))}
        </div>
      )}

      {/* 🏷️ CATEGORIES (UX SIMPLE) */}
      <div className="categories">
        {["all", "Electronique", "Vêtements", "Meubles", "Autres"].map(
          (cat) => (
            <button
              key={cat}
              className={filters.category === cat ? "active" : ""}
              onClick={() => setFilters({ ...filters, category: cat })}
            >
              {cat}
            </button>
          ),
        )}
      </div>

      <div className="filter-toggle">
        <button onClick={() => setShowFilters(!showFilters)}>⚙️ Filtres</button>
      </div>

      {/* ⚙️ FILTRES AVANCÉS (OPTIONNEL MAIS GARDE) */}
      {showFilters && (
        <div className="filters">
          <input
            type="number"
            name="minPrice"
            placeholder="Prix min"
            onChange={handleChange}
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Prix max"
            onChange={handleChange}
          />

          <input
            type="text"
            name="location"
            placeholder="📍 Ville..."
            onChange={handleChange}
          />

          <select name="sort" onChange={handleChange}>
            <option value="newest">Plus récent</option>
            <option value="priceAsc">Prix croissant</option>
            <option value="priceDesc">Prix décroissant</option>
          </select>
        </div>
      )}

      {/* 🔥 UX MESSAGE */}
      {isFallback && articles.length > 0 && <p>🔍 Résultats approximatifs</p>}

      {articles.length === 0 && <p>😕 Aucun résultat trouvé</p>}

      {/* 📦 ARTICLES */}
      <div className="articles-grid">
        {articles.map((article) => (
          <ArticleCard
            key={article._id}
            article={article}
            onLike={handleLike}
          />
        ))}
      </div>
    </div>
  );

};

export default Home;