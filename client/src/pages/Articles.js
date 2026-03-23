// src/pages/Articles.jsx
import React , { useState } from "react";
import ArticleForm from "../components/Article/ArticleForm";
import ArticleList from "../components/Article/ArticleList";

const Articles = () => {
  const [refresh, setRefresh] = useState(false);

  const handleArticleCreated = () => {
    setRefresh(!refresh);
  };

  return (
    <div>
      <h1>Articles</h1>
      <ArticleForm onArticleCreated={handleArticleCreated} />
      <ArticleList key={refresh} />
    </div>
  );
};

export default Articles;
