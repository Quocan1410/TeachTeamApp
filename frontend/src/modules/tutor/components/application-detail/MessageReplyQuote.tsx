"use client";

import React from "react";
import { scrollToCorrespondenceMessage } from "./conversationUtils";
import styles from "./MessageReplyQuote.module.css";

interface MessageReplyQuoteProps {
  senderName: string;
  body: string;
  targetMessageId?: string;
}

const MessageReplyQuote: React.FC<MessageReplyQuoteProps> = ({
  senderName,
  body,
  targetMessageId,
}) => {
  const canJump = Boolean(targetMessageId?.trim());

  const handleJump = () => {
    if (!targetMessageId) return;
    scrollToCorrespondenceMessage(targetMessageId);
  };

  const quoteContent = (
    <p className={styles.messageReplyQuote__quoteBody}>
      <span className={styles.messageReplyQuote__quoteName}>{senderName}:</span> {body}
    </p>
  );

  if (canJump) {
    return (
      <button
        type="button"
        className={`${styles.messageReplyQuote__quote} ${styles.messageReplyQuote__quoteInteractive}`}
        onClick={handleJump}
        aria-label={`Jump to message from ${senderName}`}
      >
        {quoteContent}
      </button>
    );
  }

  return (
    <blockquote className={styles.messageReplyQuote__quote} cite={senderName}>
      {quoteContent}
    </blockquote>
  );
};

export default MessageReplyQuote;
