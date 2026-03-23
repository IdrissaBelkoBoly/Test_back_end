// src/components/Notifications/NotificationItem.js
import React from "react";
import { Link } from "react-router-dom";

const NotificationItem = ({ notification }) => {
  const { message, articleId, commentId } = notification;

  const linkTo = commentId
    ? `/article/${articleId}#comment-${commentId}`
    : `/article/${articleId}`;

  return (
    <li className="p-2 border-b hover:bg-gray-100 dark:hover:bg-gray-700">
      <Link to={linkTo} className="text-sm text-gray-800 dark:text-gray-200">
        {message}
      </Link>
    </li>
  );
};

export default NotificationItem;
