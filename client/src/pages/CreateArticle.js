import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const CreateArticle = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Autres",
    location: "",
  });

  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.price) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("location", form.location);

      // 🔥 ajouter fichiers
      for (let i = 0; i < files.length; i++) {
        formData.append("media", files[i]);
      }

      const res = await fetch("http://localhost:5000/api/articles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur création");
        return;
      }

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Erreur serveur");
    }
  };

  return (
    <div className="create-article">
      <h2>Publier un article</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Titre"
          value={form.title}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <input
          type="number"
          name="price"
          placeholder="Prix"
          value={form.price}
          onChange={handleChange}
        />

        {/* CATEGORY */}
        <select name="category" onChange={handleChange}>
          <option>Electronique</option>
          <option>Vêtements</option>
          <option>Meubles</option>
          <option>Autres</option>
        </select>

        <input
          type="text"
          name="location"
          placeholder="Localisation"
          value={form.location}
          onChange={handleChange}
        />

        {/* FILE UPLOAD */}
        <input type="file" multiple onChange={handleFileChange} />

        <button type="submit">Publier</button>
      </form>
    </div>
  );
};

export default CreateArticle;
