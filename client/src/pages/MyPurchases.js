import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../auth/AuthContext";
import { getMyPurchases } from "../services/ArticleService";
import { io } from "socket.io-client";

const MyPurchases = () => {
  const { token, user } = useContext(AuthContext);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Charger les achats
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const data = await getMyPurchases(token);
        setPurchases(data);
      } catch (err) {
        console.error("Erreur récupération achats :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [token]);

  // 🔹 Initialiser le socket et écouter les notifications
  useEffect(() => {
    if (!user?._id) return;

    const socket = io("http://localhost:5000", {  transports: ["websocket"],withCredentials: true });
    socket.emit("join", user._id);
    console.log("✅ Acheteur a rejoint la salle :", user._id);

    socket.on("transferValidated", (updatedArticle) => {
      console.log("📩 Notification reçue côté acheteur :", updatedArticle);
      setPurchases((prev) =>
        prev.map((article) =>
          article._id === updatedArticle._id ? updatedArticle : article
        )
      );
      alert(`Votre paiement pour "${updatedArticle.title}" a été validé ✅`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  if (loading) return <p>Chargement...</p>;
  if (purchases.length === 0) return <p>Aucun achat pour le moment.</p>;

  return (
    <div>
      <h2>Mes achats</h2>
      {purchases.map((article) => (
        <div
          key={article._id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{article.title}</h3>
          <p>
            Vendeur : {article.author.name} ({article.author.email})
          </p>
          <p>Prix : {article.price} DH</p>
          <p>
            Transfert : {article.transferNumber || "Aucun transfert envoyé"}
          </p>
          <p>Statut : {article.transferStatus || "En attente"}</p>
          {article.media && article.media.length > 0 && (
            <div style={{ display: "flex", gap: "10px" }}>
              {article.media.map((m, idx) => (
                <img key={idx} src={m} alt="media" width="100" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyPurchases;
