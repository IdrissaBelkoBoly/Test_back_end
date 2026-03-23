import api from "./api";

// ✅ Ajoute cette fonction
export const getAllUsers = async () => {
  const response = await api.get("/users"); // assure-toi que cette route existe dans ton backend
  return response.data;
};


// 🔹 Connexion utilisateur (si besoin)
export const loginUser = async (credentials) => {
  const response = await api.post("/users/login", credentials); // ✅ ROUTE CORRECTE
  return response.data;
};

// 🔹 Supprimer un client
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`); // ✅ ROUTE CORRECTE
  return response.data;
};

// 🔹 Mettre à jour un client
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData); // ✅ ROUTE CORRECTE
  return response.data;
};

//creer un nouvel utilisateur
export const registerUser = async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
};

//Récupérer les infos de l'utilisateur connecté 
export const getCurrentUser = async (token) => {
  const response = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

//Obtenir les articles publiés par un utilisateur 
export const getUserArticles = async (userId) => {
  const response = await api.get(`/users/${userId}/articles`);
  return response.data;
};

//Obtenir les articles achétés par un utilisateur
export const getUserPurchases = async (userId) => {
  const response = await api.get(`/users/${userId}/purchases`);
  return response.data;
};


//Supprimer un utilisateur via email + mot de passe 
export const deleteUserWithPassword = async (email, password) => {
  const response = await api.delete("/users", {
    data: { email, password },
  });
  return response.data;
};

