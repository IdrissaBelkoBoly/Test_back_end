import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

const authMiddleware = async (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;
    console.log("header authorization brut:", tokenHeader);

    const token = tokenHeader?.split(" ")[1];
    console.log("token extrait:", token);

    if (!token) {
      console.log("token absent dans header");
      return res.status(401).json({ message: "Accès refusé, token manquant" });
    }

    console.log("secret utilisé:", process.env.JWT_SECRET);
    console.log("token reçu:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("token décodé :", decoded);

    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      console.log("utilisateur non trouvé en base pour l'id:", decoded.id);
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    req.user = user;
    console.log("utilisateur authentifié:", user.id);
    next();
  } catch (error) {
    console.log("Erreur middleware:", error.message);
    res.status(401).json({ message: "Token invalide", error: error.message });
  }
};

export default authMiddleware;
