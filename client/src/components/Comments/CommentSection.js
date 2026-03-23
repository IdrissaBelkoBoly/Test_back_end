// components/Comments/CommentSection.jsx
import { useEffect, useState } from "react";
import CommentService from "../../services/CommentService";
import { useAuth } from "../../auth/AuthContext";

const CommentItem = ({
  comment,
  level = 0,
  replyTo,
  setReplyTo,
  newComment,
  setNewComment,
  handleSubmit,
}) => (
  <div
    id={comment._id}
    className="comment-card"
    style={{ marginLeft: `${level * 20}px` }}
  >
    <p className="comment-author">
      {comment.author?.email || "Anonyme"}
    </p>
    <p className="comment-content">{comment.content}</p>
    <button
      onClick={() => setReplyTo(comment._id)}
      
    >
      Répondre
    </button>

    {/* Zone de réponse affichée sous le commentaire concerné */}
    {replyTo === comment._id && (
      <form onSubmit={(e) => handleSubmit(e, comment._id)} className="comment-reply">
        <textarea
          
          placeholder="Votre réponse..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div>
          <button
            type="submit"
            className="submit-btn"
          >
            Envoyer
          </button>
          <button
            type="button"
            onClick={() => {
              setReplyTo(null);
              setNewComment("");
            }}
            className="cancel-btn"
          >
            Annuler
          </button>
        </div>
      </form>
    )}

    {comment.replies?.map((reply) => (
      <CommentItem
        key={reply._id}
        comment={reply}
        level={level + 1}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        newComment={newComment}
        setNewComment={setNewComment}
        handleSubmit={handleSubmit}
      />
    ))}
  </div>
);

const CommentSection = ({ articleId }) => {
  const { token } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        const data = await CommentService.getComments(articleId, token);
        setComments(data);
      }
    };
    fetchData();
  }, [articleId, token]); // Plus de warning ici

  const handleSubmit = async (e, parentId = null) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await CommentService.createComment(
      { articleId, content: newComment, parentId },
      token
    );

    setNewComment("");
    setReplyTo(null);

    // Recharge les commentaires après envoi
    const updatedData = await CommentService.getComments(articleId, token);
    setComments(updatedData);
  };

  return (
    <div className="comment-section">
      <h3>💬 Commentaires</h3>

      {/* Formulaire principal pour commentaire racine */}
      {!replyTo && (
        <form onSubmit={(e) => handleSubmit(e, null)} className="comment-form">
          <textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
          
          >
            Publier
          </button>
        </form>
      )}

      {comments.map((c) => (
        <CommentItem
          key={c._id}
          comment={c}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          newComment={newComment}
          setNewComment={setNewComment}
          handleSubmit={handleSubmit}
        />
      ))}
    </div>
  );
};

export default CommentSection;
