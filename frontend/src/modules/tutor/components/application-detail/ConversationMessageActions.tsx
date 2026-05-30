"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ApplicationTimelineItem } from "@/shared/utils/applicationTimeline";
import styles from "./ConversationPanel.module.css";

export type MessageAction = "reply" | "edit" | "delete" | "pin";

interface ConversationMessageActionsProps {
  item: ApplicationTimelineItem;
  isPinned: boolean;
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onAction: (action: MessageAction) => void;
}

const ConversationMessageActions: React.FC<ConversationMessageActionsProps> = ({
  item,
  isPinned,
  canReply,
  canEdit,
  canDelete,
  onAction,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const run = (action: MessageAction) => {
    onAction(action);
    setOpen(false);
  };

  const items: Array<{ action: MessageAction; label: string; show: boolean }> =
    [
      { action: "reply", label: "Reply", show: canReply },
      { action: "edit", label: "Edit", show: canEdit },
      { action: "delete", label: "Delete", show: canDelete },
      { action: "pin", label: isPinned ? "Unpin" : "Pin", show: true },
    ];

  const visible = items.filter((entry) => entry.show);
  if (visible.length === 0) return null;

  return (
    <div ref={rootRef} className={styles.messageActions}>
      <button
        type="button"
        className={styles.messageActionsTrigger}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions for message ${item.id}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.messageActionsDots} aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>
      {open && (
        <div className={styles.messageActionsMenu} role="menu">
          {visible.map(({ action, label }) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              className={
                action === "delete"
                  ? styles.messageActionsMenuDanger
                  : undefined
              }
              onClick={() => run(action)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationMessageActions;
