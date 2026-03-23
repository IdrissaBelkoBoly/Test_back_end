// src/pages/CheckoutPage.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../auth/AuthContext";

const CheckoutPages = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [transferNumber, setTransferNumber] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`/api/articles/${id}`);
        setArticle(res.data);
      } catch (err) {
        console.error("Erreur de récupération :", err);
      }
    };
    fetchArticle();
  }, [id]);

  // Stripe
  const handleStripePayment = async () => {
    try {
      const body = {
        articleId: article._id,
        title: article.title,
        price: Number(article.price),
      };
      console.log("📤 Données envoyées au backend :", body);
      const res = await axios.post(
        "/api/payment/create-checkout-session",
        body
      );
      window.location.href = res.data.url;
    } catch (err) {
      console.error("❌ Erreur Stripe :", err.response?.data || err);
      alert("Erreur lors de l’initiation du paiement par carte");
    }
  };

  // Wafacash / Western Union
  const handleSendTransferNumber = async () => {
    if (!transferNumber) {
      alert("Veuillez saisir le numéro de transfert !");
      return;
    }
    try {
      await axios.put(
        `/api/articles/${id}/send-transfer`,
        { transferNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Numéro de transfert envoyé avec succès ✅");
      navigate("/purchase-success");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'envoi du numéro");
    }
  };

  const handleConfirmPurchase = async () => {
    if (!article) return;

    if (paymentMethod === "card") {
      await handleStripePayment();
    } else {
      alert(
        `Veuillez envoyer le montant à :\nNom : ${article.author.name}\nEmail : ${article.author.email}`
      );
      // Maintenant on affiche le champ pour saisir le numéro de transfert
    }
  };

  if (!article) return <p>Chargement...</p>;

  return (
    <div>
      <h2>🧾 Confirmation d’achat</h2>
      <p>
        <strong>Titre :</strong> {article.title}
      </p>
      <p>
        <strong>Description :</strong> {article.content}
      </p>
      <p>
        <strong>Prix :</strong> {article.price} €
      </p>
      <p>
        <strong>Vendeur :</strong> {article.author?.email}
      </p>

      <h3>Choisissez un mode de paiement :</h3>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value="card">💳 Carte bancaire (Stripe)</option>
        <option value="wafacash">🏦 Wafacash / Western Union</option>
      </select>

      <br />
      <br />

      {paymentMethod === "card" && (
        <button onClick={handleConfirmPurchase}>✅ Payer par carte</button>
      )}

      {paymentMethod === "wafacash" && (
        <div>
          <p>
            Envoyez le montant à :<br />
            Nom : {article.author.name}
            <br />
            Email : {article.author.email}
          </p>
          <label>
            📲 Numéro de transfert :
            <input
              type="text"
              value={transferNumber}
              onChange={(e) => setTransferNumber(e.target.value)}
              placeholder="Ex: 123456789"
            />
          </label>
          <br />
          <br />
          <button onClick={handleSendTransferNumber}>
            ✅ Envoyer le numéro de transfert
          </button>
        </div>
      )}

      <button onClick={() => navigate(-1)} style={{ marginTop: 10 }}>
        ❌ Annuler
      </button>
    </div>
  );
};

export default CheckoutPages;
