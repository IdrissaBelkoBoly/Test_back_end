import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    description: { type: String, required: true, trim: true }, // 🔥 renommé

    price: { type: Number, required: true, min: 0 },

    image: { type: String },

    media: [
      {
        type: String,
      },
    ],

    category: {
      type: String,
      enum: ["Electronique", "Vêtements", "Meubles", "Autres"],
      default: "Autres",
    },

    location: {
      type: String,
      default: "Non précisé",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isSold: { type: Boolean, default: false },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    transferNumber: { type: String, default: null },

    transferStatus: {
      type: String,
      enum: ["pending", "validated", "rejected"],
      default: "pending",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Article", ArticleSchema);
