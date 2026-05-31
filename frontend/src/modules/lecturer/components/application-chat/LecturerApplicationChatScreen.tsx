"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { ApplicationService } from "@/shared/services/applicationService";
import {
  buildApplicationTimeline,
  canLecturerSendCorrespondence,
  getCorrespondenceClosedNotice,
  type ApplicationTimelineItem,
} from "@/shared/utils/applicationTimeline";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  normalizeMessageReactions,
  type ReactableMessageId,
} from "@/shared/utils/messageReactions";
import {
  formatAppliedDateDivider,
  formatFullTimestamp,
} from "@/shared/utils/vietnamTime";
import ChatConversationToolbar from "@/modules/tutor/components/application-detail/ChatConversationToolbar";
import CandidateChatIntro from "./CandidateChatIntro";
import ConversationApplicationBlock from "@/modules/tutor/components/application-detail/ConversationApplicationBlock";
import ConversationThread from "@/modules/tutor/components/application-detail/ConversationThread";
import ConversationComposer from "@/modules/tutor/components/application-detail/ConversationComposer";
import type { MessageAction } from "@/modules/tutor/components/application-detail/ConversationMessageActions";
import {
  getLecturerComposerPerson,
  resolveReplyQuote,
} from "@/modules/tutor/components/application-detail/conversationUtils";
import ConfirmModal from "@/shared/components/common/modal/ConfirmModal";
import conversationStyles from "@/modules/tutor/components/application-detail/ConversationPanel.module.css";
import styles from "@/modules/tutor/components/application-detail/ApplicationChatScreen.module.css";

interface LecturerApplicationChatScreenProps {
  application: ApplicationResponse;
  onApplicationUpdated: (application: ApplicationResponse) => void;
  onBack: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

function canLecturerSendFeedback(application: ApplicationResponse): boolean {
  return canLecturerSendCorrespondence(application);
}

const LecturerApplicationChatScreen: React.FC<
  LecturerApplicationChatScreenProps
> = ({ application, onApplicationUpdated, onBack, showToast }) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const replyToMessageIdRef = useRef<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    setPinnedMessageId(null);
    setReplyToMessageId(null);
    replyToMessageIdRef.current = null;
    setDeleteTargetId(null);
    setDraft("");
  }, [application.id]);

  useEffect(() => {
    replyToMessageIdRef.current = replyToMessageId;
  }, [replyToMessageId]);

  const timeline = useMemo(
    () => buildApplicationTimeline(application),
    [application]
  );
  const canCompose = canLecturerSendFeedback(application);
  const closedNotice = getCorrespondenceClosedNotice(application);

  const latestCandidateId = useMemo(() => {
    const candidateItems = timeline.filter((i) => i.kind === "candidate");
    return candidateItems.length > 0
      ? candidateItems[candidateItems.length - 1].id
      : null;
  }, [timeline]);

  const isDraftDirty = draft.trim().length > 0;
  const messageReactions = useMemo(
    () => normalizeMessageReactions(application.messageReactions ?? undefined),
    [application.messageReactions]
  );

  const handleCancelDraft = useCallback(() => {
    setDraft("");
    setReplyToMessageId(null);
  }, []);

  const handleMessageAction = useCallback(
    (action: MessageAction, item: ApplicationTimelineItem) => {
      if (action === "pin") {
        setPinnedMessageId((current) =>
          current === item.id ? null : item.id
        );
        return;
      }
      if (action === "reply" && item.body) {
        setDraft("");
        setReplyToMessageId(item.id);
        return;
      }
      if (action === "delete" && item.kind === "lecturer") {
        setDeleteTargetId(item.id);
      }
    },
    []
  );

  const authPerson = useMemo(
    () => (user ? getLecturerComposerPerson(user) : null),
    [user]
  );

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) {
      showToast("Feedback cannot be empty.", "error");
      return;
    }
    setBusy(true);
    const response = await ApplicationService.updateApplicationComment(
      application.id,
      text,
      replyToMessageIdRef.current
    );
    setBusy(false);
    if (!response.success || !response.data) {
      showToast(response.message || "Failed to send feedback", "error");
      return;
    }
    onApplicationUpdated(response.data);
    setDraft("");
    setReplyToMessageId(null);
    replyToMessageIdRef.current = null;
    showToast("Feedback sent to candidate.", "success");
  };

  const handleConfirmDeleteFeedback = async () => {
    if (!deleteTargetId) return;
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
    setDeleteTargetId(null);
    showToast("Feedback removed.", "success");
  };

  const toggleReaction = async (
    messageId: ReactableMessageId,
    emoji: string
  ) => {
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
      authPerson
    );
  }, [replyToMessageId, chatItemsById, application, authPerson]);

  return (
    <div className={styles.screen}>
      <ChatConversationToolbar
        isPinned={false}
        onBack={onBack}
        onTogglePin={() => undefined}
        onClose={() => undefined}
        showActions={false}
      />

      <div className={conversationStyles.conversationShell}>
        <div className={`${conversationStyles.threadScroll} thinOrangeScroll`}>
          <CandidateChatIntro application={application} />
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
            <ConversationApplicationBlock application={application} />
          </section>
          <ConversationThread
            items={timeline}
            application={application}
            authUser={user}
            latestLecturerId={latestCandidateId}
            pinnedMessageId={pinnedMessageId}
            canCompose={canCompose}
            messageReactions={messageReactions}
            currentUserId={user?.id}
            onToggleReaction={toggleReaction}
            onMessageAction={handleMessageAction}
          />

          {!canCompose && !application.isWithdrawn && !application.candidate?.isBlocked && closedNotice && (
            <p className={conversationStyles.closedNotice}>{closedNotice}</p>
          )}

          {application.candidate?.isBlocked && (
            <p className={conversationStyles.closedNotice}>
              Account blocked — chat history is read-only.
            </p>
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

        {canCompose && (
          <ConversationComposer
            application={application}
            authUser={authPerson}
            draft={draft}
            busy={busy}
            isDraftDirty={isDraftDirty}
            replyQuote={replyQuotePreview}
            viewerRole="lecturer"
            onDraftChange={setDraft}
            onSend={handleSend}
            onCancelDraft={handleCancelDraft}
            onClearReply={() => {
              setReplyToMessageId(null);
            }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Remove feedback?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        busy={busy}
        onConfirm={handleConfirmDeleteFeedback}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default LecturerApplicationChatScreen;
