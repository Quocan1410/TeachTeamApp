"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { ApplicationService } from "@/shared/services/applicationService";
import {
  buildApplicationTimeline,
  type ApplicationTimelineItem,
} from "@/shared/utils/applicationTimeline";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  normalizeMessageReactions,
  type ReactableMessageId,
} from "@/shared/utils/messageReactions";
import ConversationThread from "@/modules/tutor/components/application-detail/ConversationThread";
import type { MessageAction } from "@/modules/tutor/components/application-detail/ConversationMessageActions";
import { getCandidateFormattedName, resolveReplyQuote } from "@/modules/tutor/components/application-detail/conversationUtils";
import ComposerReplyPreview from "@/modules/tutor/components/application-detail/ComposerReplyPreview";
import conversationStyles from "@/modules/tutor/components/application-detail/ConversationPanel.module.css";
import styles from "./LecturerApplicationChatPanel.module.css";

interface LecturerApplicationChatPanelProps {
  application: ApplicationResponse;
  onApplicationUpdated: (application: ApplicationResponse) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

function canLecturerSendFeedback(application: ApplicationResponse): boolean {
  if (application.isWithdrawn) return false;
  return application.status === "pending";
}

const LecturerApplicationChatPanel: React.FC<
  LecturerApplicationChatPanelProps
> = ({ application, onApplicationUpdated, showToast }) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState(application.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(application.comment ?? "");
    setReplyToMessageId(null);
  }, [application.id, application.comment]);

  const timeline = useMemo(
    () => buildApplicationTimeline(application),
    [application]
  );
  const canCompose = canLecturerSendFeedback(application);
  const messageReactions = useMemo(
    () => normalizeMessageReactions(application.messageReactions ?? undefined),
    [application.messageReactions]
  );

  const latestCandidateId = useMemo(() => {
    const items = timeline.filter((i) => i.kind === "candidate");
    return items.length > 0 ? items[items.length - 1].id : null;
  }, [timeline]);

  const handleMessageAction = useCallback(
    (action: MessageAction, item: ApplicationTimelineItem) => {
      if (action === "reply" && item.body) {
        setDraft("");
        setReplyToMessageId(item.id);
      }
    },
    [application]
  );

  const handleSendFeedback = async () => {
    const text = draft.trim();
    if (!text) {
      showToast("Feedback cannot be empty.", "error");
      return;
    }
    setBusy(true);
    const response = await ApplicationService.updateApplicationComment(
      application.id,
      text,
      replyToMessageId
    );
    setBusy(false);
    if (!response.success || !response.data) {
      showToast(response.message || "Failed to send feedback", "error");
      return;
    }
    onApplicationUpdated(response.data);
    setDraft("");
    setReplyToMessageId(null);
    showToast("Feedback sent to candidate.", "success");
  };

  const handleDeleteFeedback = async () => {
    if (!window.confirm("Remove your feedback from this thread?")) return;
    setBusy(true);
    const response = await ApplicationService.deleteApplicationComment(
      application.id
    );
    setBusy(false);
    if (!response.success || !response.data) {
      showToast(response.message || "Failed to delete feedback", "error");
      return;
    }
    onApplicationUpdated(response.data);
    setDraft("");
    showToast("Feedback removed.", "success");
  };

  const toggleReaction = async (messageId: ReactableMessageId, emoji: string) => {
    const response = await ApplicationService.toggleMessageReaction(
      application.id,
      messageId,
      emoji
    );
    if (!response.success || !response.data) {
      showToast(response.message || "Failed to update reaction", "error");
      return;
    }
    onApplicationUpdated(response.data);
  };

  const candidateName = getCandidateFormattedName(application);

  const chatItemsById = useMemo(() => {
    const human = timeline.filter(
      (item) => item.kind === "lecturer" || item.kind === "candidate"
    );
    return new Map(human.map((item) => [item.id, item]));
  }, [timeline]);

  const replyQuotePreview = useMemo(() => {
    if (!replyToMessageId) return null;
    return resolveReplyQuote(
      {
        id: "composer-reply",
        kind: "lecturer",
        title: "",
        at: application.appliedAt,
        replyToMessageId,
      },
      chatItemsById,
      application,
      user
    );
  }, [replyToMessageId, chatItemsById, application, user]);

  return (
    <section className={styles.panel} aria-label="Correspondence with candidate">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Correspondence</p>
          <h3 className={styles.title}>{candidateName}</h3>
        </div>
      </header>

      <div className={conversationStyles.conversationShell}>
        <div
          className={`${conversationStyles.threadScroll} thinOrangeScroll ${styles.thread}`}
        >
          <ConversationThread
            items={timeline}
            application={application}
            authUser={user}
            latestLecturerId={latestCandidateId}
            pinnedMessageId={null}
            canCompose={canCompose}
            messageReactions={messageReactions}
            currentUserId={user?.id}
            onToggleReaction={toggleReaction}
            onMessageAction={handleMessageAction}
          />

          {!canCompose && !application.isWithdrawn && (
            <p className={conversationStyles.closedNotice}>
              Correspondence is closed — a final decision has been recorded.
            </p>
          )}
        </div>

        {canCompose && (
          <footer className={styles.composer}>
            {replyQuotePreview ? (
              <ComposerReplyPreview
                senderName={replyQuotePreview.senderName}
                body={replyQuotePreview.body}
                targetMessageId={replyQuotePreview.messageId}
                align="full"
                onDismiss={() => {
                  setReplyToMessageId(null);
                }}
              />
            ) : null}
            <textarea
              className={styles.textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write feedback for the candidate…"
              rows={3}
              disabled={busy}
            />
            <div className={styles.composerActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setDraft("");
                  setReplyToMessageId(null);
                }}
                disabled={busy}
              >
                Reset
              </button>
              {application.comment?.trim() && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleDeleteFeedback}
                  disabled={busy}
                >
                  Remove feedback
                </button>
              )}
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSendFeedback}
                disabled={busy || !draft.trim()}
              >
                {busy ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </footer>
        )}
      </div>
    </section>
  );
};

export default LecturerApplicationChatPanel;
