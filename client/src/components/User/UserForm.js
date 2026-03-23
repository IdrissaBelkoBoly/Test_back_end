import React, { useState } from "react";

const UserForm = ({ onUserCreated }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ici tu appelleras ta logique pour créer un utilisateur (API, etc.)
    // Pour l'exemple on simule la création réussie :

    if (name.trim() === "") return alert("Le nom est requis");

    // Simuler la création d'utilisateur
    console.log("Utilisateur créé :", name);

    // Appeler le callback pour signaler la création à Users.jsx
    onUserCreated();

    // Reset du formulaire
    setName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nom de l'utilisateur"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Ajouter utilisateur</button>
    </form>
  );
  
};

export default UserForm;  
