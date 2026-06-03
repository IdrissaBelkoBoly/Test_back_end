import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  // gérer input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("DATA BACKEND:", data);
      console.log("USER BACKEND:", data.user);

      if (!res.ok) {
        setError(data.message || "Erreur de connexion");
        return;
      }

      console.log("✅ LOGIN OK :", data);

      // 🔥 IMPORTANT
      login(data.user, data.token);

      // redirection
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Erreur serveur");
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Se connecter</button>
      </form>
      <p>
        Pas de compte ? <a href="/register">S'inscrire</a>
      </p>
    </div>
  );
};

export default Login;
