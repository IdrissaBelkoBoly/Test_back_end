import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔥 gérer input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔒 Vérification avancée
  const checkPassword = (password) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const getStrengthLabel = (score) => {
    if (score <= 1) return { text: "Faible ❌", color: "red", width: "25%" };
    if (score === 2) return { text: "Moyen ⚠️", color: "orange", width: "50%" };
    if (score === 3) return { text: "Bon 👍", color: "blue", width: "75%" };
    return { text: "Fort 💪", color: "green", width: "100%" };
  };

  // 🔥 submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ❌ vérification confirmation
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // ❌ sécurité minimale
    if (checkPassword(form.password) < 2) {
      setError("Mot de passe trop faible");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur d'inscription");
        return;
      }

      setSuccess("Compte créé avec succès 🎉");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Erreur serveur");
    }
  };

  const score = checkPassword(form.password);
  const strength = getStrengthLabel(score);

  return (
    <div className="register-container">
      <h2>Inscription</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Nom"
          value={form.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        {/* 🔐 PASSWORD */}
        <div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            👁️
          </button>
        </div>

        {/* 🔥 INDICATEUR */}
        {form.password && (
          <div>
            <p style={{ color: strength.color }}>Force : {strength.text}</p>

            {/* 🔥 BARRE */}
            <div
              style={{
                height: "5px",
                width: "100%",
                background: "#ddd",
                borderRadius: "5px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: strength.width,
                  background: strength.color,
                  borderRadius: "5px",
                  transition: "0.3s",
                }}
              />
            </div>

            {/* 🔍 CRITÈRES */}
            <ul style={{ fontSize: "12px" }}>
              <li
                style={{ color: form.password.length >= 8 ? "green" : "red" }}
              >
                8 caractères minimum
              </li>
              <li
                style={{ color: /[A-Z]/.test(form.password) ? "green" : "red" }}
              >
                1 majuscule
              </li>
              <li
                style={{ color: /[0-9]/.test(form.password) ? "green" : "red" }}
              >
                1 chiffre
              </li>
              <li
                style={{
                  color: /[^A-Za-z0-9]/.test(form.password) ? "green" : "red",
                }}
              >
                1 symbole (@, #, !...)
              </li>
            </ul>
          </div>
        )}

        {/* CONFIRM PASSWORD */}
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmer mot de passe"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button type="submit">S'inscrire</button>
      </form>

      <p>
        Déjà un compte ? <a href="/login">Se connecter</a>
      </p>
    </div>
  );
};

export default Register;
