"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { getCourseLecturerName } from "@/shared/utils/courseLecturer";
import ApplicationDetailHeroActions from "./ApplicationDetailHeroActions";
import styles from "./ConversationPanel.module.css";

interface ConversationChatHeaderProps {
  application: ApplicationResponse;
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
}

const ConversationChatHeader: React.FC<ConversationChatHeaderProps> = ({
  application,
  isPinned,
  onTogglePin,
  onClose,
}) => {
  const lecturerName =
    getCourseLecturerName(application.course) ?? "Course team";
  const courseLabel = application.course?.courseCode ?? "Application";
  const roleLabel =
    application.role?.roleName === "lab_assistant" ? "Lab Assistant" : "Tutor";

  return (
    <header className={styles.conversationPanel__chatHeader}>
      <div className={styles.conversationPanel__chatHeaderMain}>
        <h2 className={styles.conversationPanel__chatHeaderTitle}>{lecturerName}</h2>
        <p className={styles.conversationPanel__chatHeaderSubtitle}>
          <span>{courseLabel}</span>
          <span className={styles.conversationPanel__chatHeaderDot} aria-hidden>
            ·
          </span>
          <span>{roleLabel}</span>
        </p>
      </div>
      <ApplicationDetailHeroActions
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        onClose={onClose}
        className={styles.conversationPanel__chatHeaderActions}
      />
    </header>
  );
};

export default ConversationChatHeader;
