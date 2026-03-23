import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../auth/AuthContext";
import { getMyTransfers, validateTransfer } from "../services/ArticleService";

const MyTransfers = () => {
  const { token } = useContext(AuthContext);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const data = await getMyTransfers(token);
        console.log("📦 Transferts reçus:", data); // 👈 Vérification
        setTransfers(data);
      } catch (err) {
        console.error("Erreur lors du chargement des transferts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [token]);

  const handleValidate = async (id) => {
    try {
      await validateTransfer(id, token);
      setTransfers((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, transferStatus: "validated" } : t
        )
      );
    } catch (err) {
      console.error("Erreur lors de la validation", err);
    }
  };

  if (loading) return <p>⏳ Chargement...</p>;

  return (
    <div className="transfers-container">
      <h2 className="transfers-title">📦 Mes transferts</h2>

      {transfers.length === 0 ? (
        <p className="no-transfers">⚠️ Aucun transfert trouvé.</p>
      ) : (
        <div className="transfers-list">
          {transfers.map((t) => (
            <div key={t._id} className="transfer-card">
              <h3 className="transfer-title">{t.title}</h3>
              <p className="transfer-info">💰 Prix : {t.price} MAD</p>
              <p className="transfer-info">
                🔑 Numéro de transfert :{" "}
                <b>{t.transferNumber || "Non fourni"}</b>
              </p>
              <p className="transfer-status">
                📌 Statut :{" "}
                <span
                  className={
                    t.transferStatus === "validated"
                      ? "status-validated"
                      : "status-pending"
                  }
                >
                  {t.transferStatus === "validated"
                    ? "✅ Validé"
                    : "⏳ En attente"}
                </span>
              </p>
              {t.transferStatus === "pending" && (
                <button
                  className="validate-btn"
                  onClick={() => handleValidate(t._id)}
                >
                  ✅ Valider
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTransfers;
