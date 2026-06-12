"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import type { ApplicationTimelineItem } from "@/shared/utils/applicationTimeline";
import type { ReactableMessageId } from "@/shared/utils/messageReactions";
import type { MessageReactionsMap } from "@/shared/utils/messageReactions";
import type { User } from "@/shared/types/user";
import { buildThreadEntries, dateKey, resolveReplyQuote } from "./conversationUtils";
import ConversationMessage from "./ConversationMessage";
import type { MessageAction } from "./ConversationMessageActions";
import styles from "./ConversationPanel.module.css";

interface ConversationThreadProps {
  items: ApplicationTimelineItem[];
  application: ApplicationResponse;
  authUser?: User | null;
  latestLecturerId: string | null;
  pinnedMessageId: string | null;
  canCompose: boolean;
  messageReactions: MessageReactionsMap;
  currentUserId?: number;
  onToggleReaction: (messageId: ReactableMessageId, emoji: string) => void;
  onMessageAction: (
    action: MessageAction,
    item: ApplicationTimelineItem
  ) => void;
}

const ConversationThread: React.FC<ConversationThreadProps> = ({
  items,
  application,
  authUser,
  latestLecturerId,
  pinnedMessageId,
  canCompose,
  messageReactions,
  currentUserId,
  onToggleReaction,
  onMessageAction,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  const humanItems = useMemo(
    () =>
      items
        .filter((item) => item.kind === "lecturer" || item.kind === "candidate")
        .sort(
          (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
        ),
    [items]
  );

  const entries = useMemo(
    () =>
      buildThreadEntries(humanItems, {
        skipInitialDateKey: dateKey(application.appliedAt),
      }),
    [humanItems, application.appliedAt]
  );

  const itemsById = useMemo(
    () => new Map(humanItems.map((item) => [item.id, item])),
    [humanItems]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [humanItems.length, application.id]);

  if (humanItems.length === 0) {
    return (
      <p className={styles.emptyThread} role="status">
        No messages yet. When the lecturer or you send a message, it will appear
        here.
      </p>
    );
  }

  return (
    <div className={styles.threadLog} role="log" aria-label="Correspondence">
      {entries.map((entry) => {
        if (entry.type === "date") {
          return (
            <div
              key={entry.id}
              className={`${styles.dateDivider} ${styles.dateDividerInThread}`}
              role="separator"
              aria-label={entry.label}
            >
              {entry.label}
            </div>
          );
        }

        const { item } = entry;
        return (
          <ConversationMessage
            key={item.id}
            item={item}
            application={application}
            authUser={authUser}
            highlight={item.id === latestLecturerId}
            isPinned={item.id === pinnedMessageId}
            canCompose={canCompose}
            messageReactions={messageReactions}
            currentUserId={currentUserId}
            onToggleReaction={onToggleReaction}
            onMessageAction={onMessageAction}
            replyQuote={resolveReplyQuote(
              item,
              itemsById,
              application,
              authUser
            )}
          />
        );
      })}
      <div ref={endRef} className={styles.threadEnd} aria-hidden />
    </div>
  );
};

export default ConversationThread;
