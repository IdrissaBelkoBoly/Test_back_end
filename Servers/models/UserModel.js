import mongoose from 'mongoose';
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, default: "user" },
    profilePicture: {
      type: String,
      default: "https://via.placeholder.com/100", // image par défaut
    },
  },
  { timestamps: true }
);
const User = mongoose.model('User' , userSchema);
export default User;