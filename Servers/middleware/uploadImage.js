import multer from "multer";
import path from "path";

// 📁 Dossier de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/messages/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // garder l'extension
    cb(null, Date.now() + ext);
  },
});

// ✅ Filtrer uniquement les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Seulement les fichiers images sont autorisés"), false);
  }
};

const uploadImage = multer({ storage, fileFilter });

export default uploadImage;
