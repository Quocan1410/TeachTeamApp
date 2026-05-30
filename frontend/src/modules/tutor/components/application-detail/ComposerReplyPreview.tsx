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
    className={`${styles.wrap} ${align === "full" ? styles.wrapFull : ""}`}
    role="status"
    aria-live="polite"
  >
    <div className={styles.head}>
      <span className={styles.headLabel}>Replying to {senderName}</span>
      <button
        type="button"
        className={`${styles.dismiss} iconCloseHit`}
        onClick={onDismiss}
        aria-label="Cancel reply"
      >
        <CloseIcon size={14} />
      </button>
    </div>
    <button
      type="button"
      className={styles.quote}
      onClick={() => {
        if (targetMessageId) scrollToCorrespondenceMessage(targetMessageId);
      }}
      disabled={!targetMessageId}
      aria-label={`View original message from ${senderName}`}
    >
      <p className={styles.quoteBody}>
        <span className={styles.quoteName}>{senderName}:</span> {body}
      </p>
    </button>
  </div>
);

export default ComposerReplyPreview;
