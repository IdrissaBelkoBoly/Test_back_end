import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true }, // tu peux renommer "content" → "description" si tu veux
    price: { type: Number, required: true },
    image: { type: String }, // optionnel
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transferNumber: { type: String, default: null},
    transferStatus: {type: String, enum: ["pending", "validated" , "rejected"], default: "pending"},
    isSold: { type: Boolean, default: false },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      // ✅ Ajouté ici
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    media: [
      {
        type: String, //le nom du fichier image ou video
      },
    ],
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", ArticleSchema);
export default Article;
