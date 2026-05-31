"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import {
  buildApplicationTimeline,
  canCandidateSendCorrespondence,
  candidateOfferPending,
  getCorrespondenceClosedNotice,
  type ApplicationTimelineItem,
} from "@/shared/utils/applicationTimeline";
import OfferResponsePanel from "./OfferResponsePanel";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  normalizeMessageReactions,
  type ReactableMessageId,
} from "@/shared/utils/messageReactions";
import {
  formatAppliedDateDivider,
  formatFullTimestamp,
} from "@/shared/utils/vietnamTime";
import ChatConversationToolbar from "./ChatConversationToolbar";
import LecturerChatIntro from "./LecturerChatIntro";
import ConversationApplicationBlock from "./ConversationApplicationBlock";
import ConversationThread from "./ConversationThread";
import ConversationComposer from "./ConversationComposer";
import type { MessageAction } from "./ConversationMessageActions";
import { resolveReplyQuote } from "./conversationUtils";
import ConfirmModal from "@/shared/components/common/modal/ConfirmModal";
import conversationStyles from "./ConversationPanel.module.css";
import styles from "./ApplicationChatScreen.module.css";

interface ApplicationChatScreenProps {
  application: ApplicationResponse;
  draft: string;
  busy: boolean;
  isPinned: boolean;
  onDraftChange: (value: string) => void;
  onSendNew: (replyToMessageId?: string | null) => void;
  onEditMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onWithdraw: () => void;
  onBack: () => void;
  onTogglePin: () => void;
  onClose: () => void;
  onToggleReaction: (messageId: ReactableMessageId, emoji: string) => void;
  onOfferResponse: (
    decision: "accept" | "decline",
    message: string
  ) => Promise<void>;
}

const ApplicationChatScreen: React.FC<ApplicationChatScreenProps> = ({
  application,
  draft,
  busy,
  isPinned,
  onDraftChange,
  onSendNew,
  onEditMessage,
  onDeleteMessage,
  onWithdraw,
  onBack,
  onTogglePin,
  onClose,
  onToggleReaction,
  onOfferResponse,
}) => {
  const { user } = useAuth();
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const replyToMessageIdRef = useRef<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(
    null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    setPinnedMessageId(null);
    setReplyToMessageId(null);
    replyToMessageIdRef.current = null;
    setEditingMessageId(null);
    setDeleteTargetId(null);
  }, [application.id]);

  useEffect(() => {
    replyToMessageIdRef.current = replyToMessageId;
  }, [replyToMessageId]);

  const timeline = useMemo(
    () => buildApplicationTimeline(application),
    [application]
  );
  const canCompose = canCandidateSendCorrespondence(application);
  const closedNotice = getCorrespondenceClosedNotice(application);
  const showOfferPanel = candidateOfferPending(application);

  const latestLecturerId = useMemo(() => {
    const lecturerItems = timeline.filter((i) => i.kind === "lecturer");
    return lecturerItems.length > 0
      ? lecturerItems[lecturerItems.length - 1].id
      : null;
  }, [timeline]);

  const isDraftDirty = draft.trim().length > 0;
  const messageReactions = useMemo(
    () => normalizeMessageReactions(application.messageReactions ?? undefined),
    [application.messageReactions]
  );

  const handleCancelDraft = useCallback(() => {
    onDraftChange("");
    setReplyToMessageId(null);
    setEditingMessageId(null);
  }, [onDraftChange]);

  const handleMessageAction = useCallback(
    (action: MessageAction, item: ApplicationTimelineItem) => {
      if (action === "pin") {
        setPinnedMessageId((current) =>
          current === item.id ? null : item.id
        );
        return;
      }
      if (action === "reply" && item.body) {
        onDraftChange("");
        setReplyToMessageId(item.id);
        setEditingMessageId(null);
        return;
      }
      if (action === "edit" && item.kind === "candidate") {
        onDraftChange(item.body ?? "");
        setEditingMessageId(item.id);
        setReplyToMessageId(null);
        return;
      }
      if (action === "delete" && item.kind === "candidate") {
        setDeleteTargetId(item.id);
      }
    },
    [onDraftChange]
  );

  const handleConfirmDeleteMessage = useCallback(() => {
    if (!deleteTargetId) return;
    onDeleteMessage(deleteTargetId);
    if (editingMessageId === deleteTargetId) {
      handleCancelDraft();
    }
    setDeleteTargetId(null);
  }, [deleteTargetId, editingMessageId, handleCancelDraft, onDeleteMessage]);

  const authPerson = useMemo(
    () =>
      user
        ? {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
            honorific: user.honorific,
            avatarUrl: user.avatarUrl,
          }
        : null,
    [user]
  );

  const handleSend = useCallback(() => {
    if (editingMessageId) {
      onEditMessage(editingMessageId);
    } else {
      onSendNew(replyToMessageIdRef.current);
    }
    setReplyToMessageId(null);
    replyToMessageIdRef.current = null;
    setEditingMessageId(null);
  }, [editingMessageId, onEditMessage, onSendNew]);

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
        kind: "candidate",
        title: "",
        at: application.appliedAt,
        replyToMessageId,
      },
      chatItemsById,
      application,
      authPerson
    );
  }, [replyToMessageId, chatItemsById, application, authPerson]);

  return (
    <div className={styles.screen}>
      <ChatConversationToolbar
        isPinned={isPinned}
        onBack={onBack}
        onTogglePin={onTogglePin}
        onClose={onClose}
      />

      <div className={conversationStyles.conversationShell}>
        <div
          className={`${conversationStyles.threadScroll} thinOrangeScroll`}
        >
          <LecturerChatIntro application={application} />
          <div
            className={`${conversationStyles.dateDivider} ${conversationStyles.dateDividerAppliedIntro}`}
            role="separator"
            aria-label={formatAppliedDateDivider(application.appliedAt)}
          >
            {formatAppliedDateDivider(application.appliedAt)}
          </div>
          <section
            className={conversationStyles.submissionSection}
            aria-label="Application submission"
          >
            <ConversationApplicationBlock
              application={application}
              authUser={authPerson}
            />
          </section>
          <ConversationThread
            items={timeline}
            application={application}
            authUser={user}
            latestLecturerId={latestLecturerId}
            pinnedMessageId={pinnedMessageId}
            canCompose={canCompose}
            messageReactions={messageReactions}
            currentUserId={user?.id}
            onToggleReaction={onToggleReaction}
            onMessageAction={handleMessageAction}
          />

          {!canCompose && closedNotice && (
            <p className={conversationStyles.closedNotice}>{closedNotice}</p>
          )}

          {application.isWithdrawn && (
            <p className={conversationStyles.closedNotice}>
              Withdrawn{" "}
              {application.withdrawnAt
                ? formatFullTimestamp(application.withdrawnAt)
                : "recently"}
            </p>
          )}
        </div>

        {showOfferPanel && (
          <OfferResponsePanel
            busy={busy}
            onSubmit={onOfferResponse}
          />
        )}

        {canCompose && (
          <>
            <ConversationComposer
              application={application}
              authUser={authPerson}
              draft={draft}
              busy={busy}
              isDraftDirty={isDraftDirty}
              replyQuote={replyQuotePreview}
              isEditing={!!editingMessageId}
              onDraftChange={onDraftChange}
              onSend={handleSend}
              onCancelDraft={handleCancelDraft}
              onClearReply={() => {
                setReplyToMessageId(null);
              }}
            />
            <div className={conversationStyles.threadFooter}>
              <button
                type="button"
                className={conversationStyles.withdrawLink}
                onClick={onWithdraw}
                disabled={busy}
              >
                Withdraw application
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete message?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        busy={busy}
        onConfirm={handleConfirmDeleteMessage}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default ApplicationChatScreen;
