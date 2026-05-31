"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import type { AvatarPerson } from "./conversationUtils";
import {
  getCandidateAvatarPerson,
  getLecturerComposerPerson,
} from "./conversationUtils";
import ConversationAvatar from "./ConversationAvatar";
import ComposerReplyPreview from "./ComposerReplyPreview";
import styles from "./ConversationPanel.module.css";
import type { ReplyQuotePreview } from "./conversationUtils";

interface ConversationComposerProps {
  application: ApplicationResponse;
  authUser?: AvatarPerson | null;
  draft: string;
  busy: boolean;
  isDraftDirty: boolean;
  replyQuote?: ReplyQuotePreview | null;
  isEditing?: boolean;
  viewerRole?: "candidate" | "lecturer";
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onCancelDraft: () => void;
  onClearReply?: () => void;
}

const ConversationComposer: React.FC<ConversationComposerProps> = ({
  application,
  authUser,
  draft,
  busy,
  isDraftDirty,
  replyQuote,
  isEditing,
  viewerRole = "candidate",
  onDraftChange,
  onSend,
  onCancelDraft,
  onClearReply,
}) => {
  const avatarPerson =
    viewerRole === "lecturer"
      ? getLecturerComposerPerson(authUser)
      : getCandidateAvatarPerson(application, authUser);
  const composerId =
    viewerRole === "lecturer" ? "lecturer-feedback" : "candidate-response";
  const placeholder =
    viewerRole === "lecturer"
      ? "Write feedback for the candidate…"
      : "Write a message...";
  const editHint =
    viewerRole === "lecturer" ? "Editing your feedback" : "Editing your message";

  return (
    <footer className={styles.composer} aria-label="Write a reply">
      {replyQuote && onClearReply ? (
        <ComposerReplyPreview
          senderName={replyQuote.senderName}
          body={replyQuote.body}
          targetMessageId={replyQuote.messageId}
          onDismiss={onClearReply}
        />
      ) : null}
      {isEditing && (
        <p className={styles.composerEditHint}>{editHint}</p>
      )}
      <div className={styles.composerRow}>
        <ConversationAvatar
          person={avatarPerson}
          variant={viewerRole === "lecturer" ? "lecturer" : "you"}
          className={styles.composerAvatar}
        />
        <div className={styles.composerField}>
          <textarea
            id={composerId}
            className={styles.composerTextarea}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            aria-label={
              viewerRole === "lecturer" ? "Your feedback" : "Your reply"
            }
          />
          {(isDraftDirty || draft.trim() || replyQuote || isEditing) && (
            <div className={styles.composerActions}>
              <button
                type="button"
                className={`${styles.composerBtn} ${styles.composerBtnGhost}`}
                onClick={onCancelDraft}
                disabled={busy || (!isDraftDirty && !replyQuote && !isEditing)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.composerBtn} ${styles.composerBtnPrimary}`}
                onClick={onSend}
                disabled={busy || !draft.trim()}
              >
                {isEditing ? "Save" : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default ConversationComposer;
