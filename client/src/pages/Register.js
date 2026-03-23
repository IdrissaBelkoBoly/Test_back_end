// src/auth/Register.jsx
import { useState, useContext } from "react";
import AuthContext from "../auth/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/users/register", {
        name,
        email,
        password,
      });

      // Connexion automatique après inscription
      login(res.data.user, res.data.token);
      navigate("/"); // Redirection vers la page d’accueil ou dashboard
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Inscription</h2>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Mot de passe avec toggle */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"} // 👈 bascule entre text et password
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit">Créer un compte</button>
        <p>
          Déjà inscrit ? <a href="/login">Se connecter</a>
        </p>
      </form>
    </div>
  );
}

export default Register;
