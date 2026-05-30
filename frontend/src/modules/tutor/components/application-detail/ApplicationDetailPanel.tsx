"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import ApplicationDetailHero from "./ApplicationDetailHero";
import ApplicationOverviewScreen from "./ApplicationOverviewScreen";
import ApplicationChatScreen from "./ApplicationChatScreen";
import type { ReactableMessageId } from "@/shared/utils/messageReactions";
import {
  detailViewVariants,
  getDetailViewTransition,
  type DetailNavDirection,
} from "./detailViewMotion";
import styles from "./ApplicationDetailPanel.module.css";

type DetailView = "overview" | "chat";

interface ApplicationDetailPanelProps {
  application: ApplicationResponse;
  draft: string;
  busy: boolean;
  isPinned: boolean;
  onDraftChange: (value: string) => void;
  onSendNew: (replyToMessageId?: string | null) => void;
  onEditMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onWithdraw: () => void;
  onClose: () => void;
  onTogglePin: () => void;
  onToggleReaction: (messageId: ReactableMessageId, emoji: string) => void;
  hideSummary?: boolean;
  hideApplicationDetails?: boolean;
}

const ApplicationDetailPanel: React.FC<ApplicationDetailPanelProps> = ({
  application,
  draft,
  busy,
  isPinned,
  onDraftChange,
  onSendNew,
  onEditMessage,
  onDeleteMessage,
  onWithdraw,
  onClose,
  onTogglePin,
  onToggleReaction,
  hideSummary = false,
}) => {
  const [view, setView] = useState<DetailView>("overview");
  const [direction, setDirection] = useState<DetailNavDirection>(1);
  const reduceMotion = useReducedMotion();
  const viewTransition = getDetailViewTransition(reduceMotion);

  const openChat = useCallback(() => {
    setDirection(1);
    setView("chat");
  }, []);

  const backToOverview = useCallback(() => {
    setDirection(-1);
    setView("overview");
  }, []);

  useEffect(() => {
    setView("overview");
    setDirection(1);
  }, [application.id]);

  if (!hideSummary) {
    return (
      <aside className={styles.panel} aria-label="Application details">
        <ApplicationDetailHero
          application={application}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onClose={onClose}
        />
        <ApplicationOverviewScreen
          application={application}
          isPinned={isPinned}
          onOpenChat={() => setView("chat")}
          onTogglePin={onTogglePin}
          onClose={onClose}
        />
      </aside>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Application details">
      <div className={styles.viewStage}>
        <AnimatePresence initial={false} custom={direction}>
          {view === "overview" ? (
            <motion.div
              key={`overview-${application.id}`}
              className={styles.viewPage}
              custom={direction}
              variants={detailViewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={viewTransition}
            >
              <ApplicationOverviewScreen
                application={application}
                isPinned={isPinned}
                onOpenChat={openChat}
                onTogglePin={onTogglePin}
                onClose={onClose}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`chat-${application.id}`}
              className={styles.viewPage}
              custom={direction}
              variants={detailViewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={viewTransition}
            >
              <ApplicationChatScreen
                application={application}
                draft={draft}
                busy={busy}
                isPinned={isPinned}
                onDraftChange={onDraftChange}
                onSendNew={onSendNew}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onWithdraw={onWithdraw}
                onBack={backToOverview}
                onTogglePin={onTogglePin}
                onClose={onClose}
                onToggleReaction={onToggleReaction}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default ApplicationDetailPanel;
