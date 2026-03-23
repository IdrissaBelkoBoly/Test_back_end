// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Ajout automatique du token dans les headers si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // ou sessionStorage si tu l’utilises
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("headers envoyés:",config.headers);

  return config;
});

export default api;
