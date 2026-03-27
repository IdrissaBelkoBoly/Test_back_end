import jwt from 'jsonwebtoken';
import UserModel from "../models/UserModel.js"; // Assure-toi que l'extension est correcte (.js)
import ArticleModel from "../models/ArticleModel.js";
import bcrypt from 'bcrypt';
import generateToken from '../Utils/generateToken.js';

export const newUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Hasher le mot de passe avant de l’enregistrer
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer un nouvel utilisateur avec le mot de passe hashé
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
    });

    // Enregistrer dans la base de données
    await newUser.save();

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.log("Erreur lors de l'inscription :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Vérifier si l'utilisateur existe
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // 2. Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // 3. Générer le token
   /* const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    ); on fait sa seulement si nous n'avons pas de fichier utils */
// generer un token avec notre Util 

const token = generateToken(user._id);

    // 4. Retourner les infos
    res.status(200).json({
      message: "Connexion réussie",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.log("Erreur lors de la connexion :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Introuvable" });
    }

    await user.deleteOne();

    res.json({ message: "Compte supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password"); // Ne pas retourner les mots de passe
    res.status(200).json(users);
  } catch (error) {
    console.log("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Profil de l'utilisateur connecté
export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur dans getMe :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Articles publiés par un utilisateur
export const getUserArticles = async (req, res) => {
  try {
    const userId = req.params.id;
    const articles = await ArticleModel.find({ author: userId });
    res.status(200).json(articles);
  } catch (error) {
    console.error("Erreur getUserArticles :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Articles achetés par un utilisateur
export const getUserPurchases = async (req, res) => {
  try {
    const userId = req.params.id;
    const purchases = await ArticleModel.find({ buyer: userId });
    res.status(200).json(purchases);
  } catch (error) {
    console.error("Erreur getUserPurchases :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



//export default {newUser, deleteUser, loginUser };
