import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true, minlength: 6 },

    avatar: { type: String },

    profilePicture: {
      type: String,
      default: "https://ui-avatars.com/api/?name=User",
    },

    role: { type: String, default: "user" },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
