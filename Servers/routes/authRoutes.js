import express from "express";
import { newUser, loginUser } from "../controllers/UserController.js";

const router = express.Router();

router.post("/register", newUser);
router.post("/login", loginUser);

export default router;
