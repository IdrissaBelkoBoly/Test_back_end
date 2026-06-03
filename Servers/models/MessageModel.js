import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,

    // 🔥 AJOUT ICI
    audio: {
      type: String,
    },

    image: {
      // ✅ OBLIGATOIRE
      type: String,
    },

    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],

    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    type: {
      type: String,
      enum: ["text", "audio", "image", "video", "file" , "location"],
      default: "text",
    },

    video: { type: String },
    file: { type: String },

    seen: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true },
);

export default mongoose.model("Message", messageSchema);
