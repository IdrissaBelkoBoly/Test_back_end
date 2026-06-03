import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/audio/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".webm");
  },
});

const uploadAudio = multer({ storage });

export default uploadAudio;
