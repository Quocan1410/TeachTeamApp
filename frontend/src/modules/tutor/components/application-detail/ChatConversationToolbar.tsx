"use client";

import React from "react";
import ApplicationDetailHeroActions from "./ApplicationDetailHeroActions";
import styles from "./ChatConversationToolbar.module.css";

interface ChatConversationToolbarProps {
  isPinned: boolean;
  onBack: () => void;
  onTogglePin: () => void;
  onClose: () => void;
  showActions?: boolean;
}

const ChatConversationToolbar: React.FC<ChatConversationToolbarProps> = ({
  isPinned,
  onBack,
  onTogglePin,
  onClose,
  showActions = true,
}) => (
  <header className={styles.toolbar}>
    <button
      type="button"
      className={styles.backBtn}
      onClick={onBack}
      aria-label="Back to application overview"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Overview</span>
    </button>
    {showActions ? (
      <ApplicationDetailHeroActions
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        onClose={onClose}
        className={styles.actions}
      />
    ) : null}
  </header>
);

export default ChatConversationToolbar;
