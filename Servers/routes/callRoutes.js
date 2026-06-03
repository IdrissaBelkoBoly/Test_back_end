import express from "express";
import {
  createCall,
  updateCall,
  getUserCalls,
  saveMissedCall,
  deleteCall,
  saveRejectedCall,
} from "../controllers/callController.js";

const router = express.Router();

/* ➜ démarrer appel */
router.post("/", createCall);

/* ➜ terminer appel */
router.put("/:callId", updateCall);

/* ➜ historique user */
router.get("/:userId", getUserCalls);

/* ➜ appel manqué */
router.post("/missed", saveMissedCall);

router.delete("/:id", deleteCall);

router.post("/rejected", saveRejectedCall);

export default router;
