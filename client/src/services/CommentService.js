// services/CommentService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/comments";

const createComment = async (commentData, token) => {
  const res = await axios.post(API_URL, commentData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

const getComments = async (articleId, token) => {
  const res = await axios.get(`${API_URL}/${articleId}`, {
    headers:{
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// ✅ Définir l’objet avant de l’exporter
const CommentService = {
  createComment,
  getComments,
};

export default CommentService;
