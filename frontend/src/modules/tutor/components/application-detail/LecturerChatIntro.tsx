"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { useUserPresence } from "@/shared/hooks/useUserPresence";
import ConversationAvatar from "./ConversationAvatar";
import { getLecturerAvatarPerson, getLecturerFormattedName } from "./conversationUtils";
import { formatRoleLabel } from "@/shared/utils/applicationFormat";
import styles from "./LecturerChatIntro.module.css";

interface LecturerChatIntroProps {
  application: ApplicationResponse;
}

const LecturerChatIntro: React.FC<LecturerChatIntroProps> = ({ application }) => {
  const lecturerDisplayName = getLecturerFormattedName(application);
  const person = getLecturerAvatarPerson(application) ?? {
    firstName: lecturerDisplayName,
    email: "",
    userType: "lecturer",
  };
  const courseCode = application.course?.courseCode ?? "";
  const courseName = application.course?.courseName ?? "";
  const roleLabel = formatRoleLabel(application.role?.roleName ?? "tutor");
  const headline = [courseCode, roleLabel].filter(Boolean).join(" · ");
  const lecturerUserId = person.userId;
  const lecturerOnline = useUserPresence(lecturerUserId);

  return (
    <div className={styles.lecturerChatIntro__intro} aria-label="Conversation with lecturer">
      <div className={styles.lecturerChatIntro__avatarWrap}>
        <ConversationAvatar
          person={person}
          variant="lecturer"
          size={64}
          className={styles.lecturerChatIntro__avatar}
        />
        {lecturerUserId != null && lecturerOnline ? (
          <span
            className={styles.lecturerChatIntro__onlineDot}
            title={`${lecturerDisplayName} is online`}
            aria-label={`${lecturerDisplayName} is online`}
          />
        ) : null}
      </div>
      <div className={styles.lecturerChatIntro__text}>
        <h2 className={styles.lecturerChatIntro__name}>{lecturerDisplayName}</h2>
        {headline ? <p className={styles.lecturerChatIntro__headline}>{headline}</p> : null}
        {courseName ? <p className={styles.lecturerChatIntro__subline}>{courseName}</p> : null}
      </div>
    </div>
  );
};

export default LecturerChatIntro;
