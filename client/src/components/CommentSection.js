import React, { useEffect, useState, useCallback } from "react";

const CommentSection = ({ articleId, token }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");

  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // 🔥 LOAD COMMENTS (PROPRE)
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/comments/${articleId}`,
      );
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  }, [articleId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]); // ✅ plus de warning

  // ✍️ ADD COMMENT
  const handleComment = async () => {
    if (!content.trim()) return;

    await fetch("http://localhost:5000/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        articleId,
        content,
      }),
    });

    setContent("");
    loadComments();
  };

  // 💬 ADD REPLY
  const handleReply = async (parentId) => {
    if (!replyContent.trim()) return;

    await fetch("http://localhost:5000/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        articleId,
        content: replyContent,
        parentId,
      }),
    });

    setReplyContent("");
    setReplyTo(null);
    loadComments();
  };

  // 🔁 THREAD RENDER
  const renderComments = (comments) => {
    return comments.map((c) => (
      <div
        key={c._id}
        className="comment"
        style={{ marginLeft: c.parentId ? "20px" : "0px" }}
      >
        <p className="comment-author">
          👤 {c.author?.name || c.author?.email || "Utilisateur"}
        </p>

        <p className="comment-text">{c.content}</p>

        <button onClick={() => setReplyTo(c._id)}>Répondre</button>

        {replyTo === c._id && (
          <div className="reply-box">
            <input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Répondre..."
            />
            <button onClick={() => handleReply(c._id)}>Envoyer</button>
          </div>
        )}

        {c.replies && renderComments(c.replies)}
      </div>
    ));
  };

  return (
    <div className="comment-section">
      <h3>💬 Commentaires</h3>

      {/* FORM */}
      <div className="comment-box">
        <input
          type="text"
          placeholder="Écrire un commentaire..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleComment}>Envoyer</button>
      </div>

      {/* LIST */}
      <div className="comments">{renderComments(comments)}</div>
    </div>
  );
};

export default CommentSection;
