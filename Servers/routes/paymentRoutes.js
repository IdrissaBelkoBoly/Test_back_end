// backend/routes/paymentRoutes.js
import express from "express";
import Stripe from "stripe";
import "dotenv/config";


const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ⚠️ remplace par ta vraie clé stripe

// Créer une session de paiement Stripe
router.post("/create-checkout-session", async (req, res) => {
  const { articleId, title, price } = req.body;

  console.log("📩 Données reçues du frontend :", req.body);
  const amount = Math.round(Number(price)* 100);

  // Vérification du prix
  if (!price || isNaN(price) || price <= 0 || amount >99999999) {
    return res.status(400).json({ error: "Prix invalide" });
  }


  // Vérification limite Stripe (max 999 999,99 € = 99 999 999 centimes)
  if (amount > 999999) {
    return res.status(400).json({ error: "Prix trop élevé pour Stripe" });
  }

  console.log("💰 Montant envoyé à Stripe (centimes) :", amount);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Carte bancaire
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: title,
            },
            unit_amount: amount, // Stripe demande les prix en centimes
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("❌ Erreur Stripe :", err);
    res.status(500).json({ error: "Erreur Stripe" });
  }
});

export default router;