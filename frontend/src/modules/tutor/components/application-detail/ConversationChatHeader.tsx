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
    <header className={styles.chatHeader}>
      <div className={styles.chatHeaderMain}>
        <h2 className={styles.chatHeaderTitle}>{lecturerName}</h2>
        <p className={styles.chatHeaderSubtitle}>
          <span>{courseLabel}</span>
          <span className={styles.chatHeaderDot} aria-hidden>
            ·
          </span>
          <span>{roleLabel}</span>
        </p>
      </div>
      <ApplicationDetailHeroActions
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        onClose={onClose}
        className={styles.chatHeaderActions}
      />
    </header>
  );
};

export default ConversationChatHeader;
