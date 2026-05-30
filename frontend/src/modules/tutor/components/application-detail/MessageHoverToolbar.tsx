"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MESSAGE_REACTION_OPTIONS,
  QUICK_MESSAGE_REACTIONS,
  type MessageReactionsMap,
  userReactedWith,
} from "@/shared/utils/messageReactions";
import type { MessageAction } from "./ConversationMessageActions";
import styles from "./MessageHoverToolbar.module.css";

function AddReactionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5.35" cy="7.1" r="0.55" fill="currentColor" />
      <circle cx="8.65" cy="7.1" r="0.55" fill="currentColor" />
      <path
        d="M5.4 9.55c.75.85 1.45 1.25 2.35 1.25s1.6-.4 2.35-1.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M11.35 4.15h1.35M12.03 3.47v1.35"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 3.5 2 6l2.5 2.5M2 6h6.5a3.5 3.5 0 0 1 0 7H8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MessageHoverToolbarProps {
  messageId: string;
  reactions: MessageReactionsMap;
  currentUserId?: number;
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isPinned: boolean;
  onToggleReaction: (emoji: string) => void;
  onAction: (action: MessageAction) => void;
}

const MessageHoverToolbar: React.FC<MessageHoverToolbarProps> = ({
  messageId,
  reactions,
  currentUserId,
  canReply,
  canEdit,
  canDelete,
  isPinned,
  onToggleReaction,
  onAction,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen && !menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [pickerOpen, menuOpen]);

  const moreItems: Array<{ action: MessageAction; label: string; show: boolean }> =
    [
      { action: "edit", label: "Edit", show: canEdit },
      { action: "delete", label: "Delete", show: canDelete },
      { action: "pin", label: isPinned ? "Unpin" : "Pin", show: true },
    ];
  const visibleMore = moreItems.filter((entry) => entry.show);

  const quickLabels = new Map(
    MESSAGE_REACTION_OPTIONS.map((option) => [option.emoji, option.label])
  );

  const runMenuAction = (action: MessageAction) => {
    onAction(action);
    setMenuOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={styles.toolbar}
      role="toolbar"
      aria-label="Message actions"
    >
      {QUICK_MESSAGE_REACTIONS.map((emoji) => {
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
            className={`${styles.btn} ${styles.btnEmoji} ${
              active ? styles.btnActive : ""
            }`}
            aria-pressed={active}
            aria-label={quickLabels.get(emoji) ?? "React"}
            title={quickLabels.get(emoji) ?? "React"}
            onClick={() => onToggleReaction(emoji)}
          >
            <span className={styles.btnIcon} aria-hidden>
              {emoji}
            </span>
          </button>
        );
      })}

      <div className={styles.addWrap}>
        <button
          type="button"
          className={styles.btn}
          aria-expanded={pickerOpen}
          aria-label="Add reaction"
          title="Add reaction"
          onClick={() => {
            setMenuOpen(false);
            setPickerOpen((open) => !open);
          }}
        >
          <AddReactionIcon />
        </button>
        {pickerOpen && (
          <div className={styles.picker} role="menu">
            {MESSAGE_REACTION_OPTIONS.map(({ emoji, label }) => {
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
                  role="menuitem"
                  className={`${styles.pickerEmoji} ${
                    active ? styles.pickerEmojiActive : ""
                  }`}
                  aria-label={label}
                  title={label}
                  onClick={() => {
                    onToggleReaction(emoji);
                    setPickerOpen(false);
                  }}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {canReply && (
        <>
          <span className={styles.divider} aria-hidden />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnReply}`}
            aria-label="Reply"
            title="Reply"
            onClick={() => onAction("reply")}
          >
            <ReplyIcon />
          </button>
        </>
      )}

      {visibleMore.length > 0 && (
        <>
          <span className={styles.divider} aria-hidden />
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.btn}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More actions"
              title="More actions"
              onClick={() => {
                setPickerOpen(false);
                setMenuOpen((open) => !open);
              }}
            >
              <span className={styles.moreDots} aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
            {menuOpen && (
              <div className={styles.menu} role="menu">
                {visibleMore.map(({ action, label }) => (
                  <button
                    key={action}
                    type="button"
                    role="menuitem"
                    className={
                      action === "delete" ? styles.menuDanger : undefined
                    }
                    onClick={() => runMenuAction(action)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageHoverToolbar;
