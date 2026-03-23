import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../auth/AuthContext";
import { getMyConfirmations } from "../services/ArticleService";

const ConfirmationsPage = () => {
  const { token } = useContext(AuthContext);
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfirmations = async () => {
      try {
        const data = await getMyConfirmations(token);
        setConfirmations(data);
      } catch (err) {
        console.error("Erreur récupération confirmations :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfirmations();
  }, [token]);

  if (loading) return <p>Chargement...</p>;
  if (confirmations.length === 0)
    return <p>Aucune confirmation pour le moment.</p>;

  return (
    <div className="confirmation-container">
      <h2 className="confirmation-title">Mes confirmations de paiement</h2>
      <div className="confirmation-list">
        {confirmations.map((article) => (
          <div key={article._id} className="confirmation-card">
            <h3>{article.title}</h3>
            <p className="confirmation-info">
              Vendeur : {article.author.name} ({article.author.email})
            </p>
            <p className="confirmation-info">Prix : {article.price} DH</p>
            <p className="confirmation-info">
              Numéro de transfert : {article.transferNumber || "Non fourni"}
            </p>
            <p>✅ Statut : {article.transferStatus}</p>

            <span
              className={`confirmation-status ${
                article.transferStatus === "validated"
                  ? "status-validated"
                  : "status-pending"
              }`}
            >
              {article.transferStatus === "validated"
                ? "✅ Validé"
                : "⏳ En attente"}
            </span>

            {article.media?.length > 0 && (
              <div className="confirmation-media">
                {article.media.map((m, idx) => (
                  <img key={idx} src={m} alt="media" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfirmationsPage;
