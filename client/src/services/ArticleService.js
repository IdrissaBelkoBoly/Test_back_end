import axios from "axios";
import api from "./api";

const API_URL = "http://localhost:5000/api/articles"; // <- ajouter cette ligne en haut



// 🔹 Récupérer tous les articles
export const getAllArticles = async () => {
 // const response = await api.get("/articles");
 const response = await api.get("/articles");
  return response.data;
};

// 🔹 Créer un nouvel article
export const createArticle = async (articleData, token) => {
  const response = await axios.post(
    "http://localhost:5000/api/articles",
    articleData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// 🔹 Supprimer un article
/*export const deleteArticle = async (articleId) => {
  const response = await api.delete(`/articles/${articleId}`);
  return response.data;
};*/
export const deleteArticle = async (id, token) => {
  await api.delete(`/articles/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 🔹 Mettre à jour un article (optionnel)
export const updateArticle = async (id, articleData, token) => {
  const response = await api.put(`/articles/${id}`, articleData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// 🔹 Acheter un article
export const buyArticle = async (id, token) => {
  const response = await api.put(`/articles/${id}/buy`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aimé un article 
export const likeArticle = async (id, token) => {
  const response = await api.post(
    `/articles/${id}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

// Recuperer les details d'un artilce
export const getArticleById = async (id) => {
  const response = await api.get(`/articles/${id}`);
  return response.data;
};

// Ajouter un commentaire à un article
export const addComment = async (articleId, text, token) => {
  const response = await api.post(
    `/articles/${articleId}/comment`,
    { text },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};


// services/ArticleService.js
export const getMyArticles = async (token) => {
  const res = await fetch("http://localhost:5000/api/articles/my-article", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des articles");
  return await res.json();
};


// Récupérer les transferts du vendeur
export const getMyTransfers = async (token) => {
  const res = await axios.get(`${API_URL}/my-transfers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Valider un transfert
export const validateTransfer = async (id, token) => {
  const res = await axios.put(`${API_URL}/${id}/validate-transfer`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Récupérer les achats de l'utilisateur
export const getMyPurchases = async (token) => {
  const res = await axios.get(`${API_URL}/my-purchases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Récupérer les confirmations validées
export const getMyConfirmations = async (token) => {
  const res = await fetch("http://localhost:5000/api/articles/my-confirmations", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Erreur récupération confirmations");
  return res.json();
};





