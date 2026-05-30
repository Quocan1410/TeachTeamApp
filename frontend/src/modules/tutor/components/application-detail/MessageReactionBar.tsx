"use client";

import React from "react";
import {
  MESSAGE_REACTION_OPTIONS,
  type MessageReactionsMap,
  userReactedWith,
} from "@/shared/utils/messageReactions";
import styles from "./MessageReactionBar.module.css";

interface MessageReactionBarProps {
  messageId: string;
  reactions: MessageReactionsMap;
  currentUserId?: number;
  onToggle: (emoji: string) => void;
}

/** Persistent reaction chips shown under a message (after reactions are added). */
const MessageReactionBar: React.FC<MessageReactionBarProps> = ({
  messageId,
  reactions,
  currentUserId,
  onToggle,
}) => {
  const messageReactions = reactions[messageId] ?? {};

  const activeChips = MESSAGE_REACTION_OPTIONS.filter(({ emoji }) => {
    const count = messageReactions[emoji]?.length ?? 0;
    const active = userReactedWith(
      reactions,
      messageId,
      emoji,
      currentUserId
    );
    return count > 0 || active;
  });

  if (activeChips.length === 0) return null;

  return (
    <div className={styles.tray} role="group" aria-label="Message reactions">
      {activeChips.map(({ emoji, label }) => {
        const count = messageReactions[emoji]?.length ?? 0;
        const active = userReactedWith(
          reactions,
          messageId,
          emoji,
          currentUserId
        );

        return (
          <button
            key={emoji}
            type="button"
            className={`${styles.chip} ${active ? styles.chipActive : ""}`}
            aria-pressed={active}
            aria-label={`${label}${count > 0 ? `, ${count}` : ""}`}
            title={label}
            onClick={() => onToggle(emoji)}
          >
            <span className={styles.emoji} aria-hidden>
              {emoji}
            </span>
            {count > 0 ? (
              <span className={styles.count}>{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactionBar;
