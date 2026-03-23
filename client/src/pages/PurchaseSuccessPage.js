import { Link } from "react-router-dom";

const PurchaseSuccessPage = () => {
  return (
    <div>
      <h2>✅ Achat confirmé !</h2>
      <p>Merci pour votre achat.</p>
      <Link to="/profile">Voir mes articles</Link>
      <br />
      <Link to="/">Retour à l'accueil</Link>
    </div>
  );
};

export default PurchaseSuccessPage;
