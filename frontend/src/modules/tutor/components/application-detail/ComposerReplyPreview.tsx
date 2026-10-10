"use client";

import React from "react";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import { scrollToCorrespondenceMessage } from "./conversationUtils";
import styles from "./ComposerReplyPreview.module.css";

interface ComposerReplyPreviewProps {
  senderName: string;
  body: string;
  targetMessageId?: string;
  onDismiss: () => void;
  align?: "composer" | "full";
}

const ComposerReplyPreview: React.FC<ComposerReplyPreviewProps> = ({
  senderName,
  body,
  targetMessageId,
  onDismiss,
  align = "composer",
}) => (
  <div
    className={`${styles.composerReplyPreview__wrap} ${align === "full" ? styles.composerReplyPreview__wrapFull : ""}`}
    role="status"
    aria-live="polite"
  >
    <div className={styles.composerReplyPreview__head}>
      <span className={styles.composerReplyPreview__headLabel}>Replying to {senderName}</span>
      <button
        type="button"
        className={`${styles.composerReplyPreview__dismiss} iconClose__hit iconClose__circle`}
        onClick={onDismiss}
        aria-label="Cancel reply"
      >
        <CloseIcon size={14} />
      </button>
    </div>
    <button
      type="button"
      className={styles.composerReplyPreview__quote}
      onClick={() => {
        if (targetMessageId) scrollToCorrespondenceMessage(targetMessageId);
      }}
      disabled={!targetMessageId}
      aria-label={`View original message from ${senderName}`}
    >
      <p className={styles.composerReplyPreview__quoteBody}>
        <span className={styles.composerReplyPreview__quoteName}>{senderName}:</span> {body}
      </p>
    </button>
  </div>
);

export default ComposerReplyPreview;
