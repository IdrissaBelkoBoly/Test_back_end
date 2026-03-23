import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Dossier pour stocker les fichiers liés aux articles
const articleUploadDir = path.join(__dirname, "..", "uploads", "articles");

if (!fs.existsSync(articleUploadDir)) {
  fs.mkdirSync(articleUploadDir, { recursive: true });
}

// 🛠️ Configuration de stockage pour les fichiers articles
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, articleUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `media-${uniqueName}${ext}`);
  },
});

// ✅ Autoriser images et vidéos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "video/mov",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non supporté"), false);
  }
};

const articleUpload = multer({ storage, fileFilter });

export default articleUpload;
