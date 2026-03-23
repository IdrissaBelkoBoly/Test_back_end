import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },//destinateur
    sender: {type: mongoose.Schema.Types.ObjectId, ref: "User"}, // celui qui à généré la notification
    type: { type: String, enum:["reply", "comment", "like", "purchase"], required: true }, // ex: 'reply', 'like', etc.
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    message: { type: String , required:true},
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
