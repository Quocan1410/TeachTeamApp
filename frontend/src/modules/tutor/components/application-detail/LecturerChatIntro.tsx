"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { useUserPresence } from "@/shared/hooks/useUserPresence";
import ConversationAvatar from "./ConversationAvatar";
import { getLecturerAvatarPerson, getLecturerFormattedName } from "./conversationUtils";
import styles from "./LecturerChatIntro.module.css";

interface LecturerChatIntroProps {
  application: ApplicationResponse;
}

function formatRoleLabel(roleName: string) {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
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
    <div className={styles.intro} aria-label="Conversation with lecturer">
      <div className={styles.avatarWrap}>
        <ConversationAvatar
          person={person}
          variant="lecturer"
          size={64}
          className={styles.avatar}
        />
        {lecturerUserId != null && lecturerOnline ? (
          <span
            className={styles.onlineDot}
            title={`${lecturerDisplayName} is online`}
            aria-label={`${lecturerDisplayName} is online`}
          />
        ) : null}
      </div>
      <div className={styles.text}>
        <h2 className={styles.name}>{lecturerDisplayName}</h2>
        {headline ? <p className={styles.headline}>{headline}</p> : null}
        {courseName ? <p className={styles.subline}>{courseName}</p> : null}
      </div>
    </div>
  );
};

export default LecturerChatIntro;
