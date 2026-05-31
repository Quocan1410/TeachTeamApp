"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { useUserPresence } from "@/shared/hooks/useUserPresence";
import ConversationAvatar from "@/modules/tutor/components/application-detail/ConversationAvatar";
import {
  getCandidateAvatarPerson,
  getCandidateFormattedName,
} from "@/modules/tutor/components/application-detail/conversationUtils";
import styles from "./CandidateChatIntro.module.css";

interface CandidateChatIntroProps {
  application: ApplicationResponse;
}

function formatRoleLabel(roleName: string) {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
}

const CandidateChatIntro: React.FC<CandidateChatIntroProps> = ({
  application,
}) => {
  const candidateDisplayName = getCandidateFormattedName(application);
  const person = getCandidateAvatarPerson(application);
  const courseCode = application.course?.courseCode ?? "";
  const courseName = application.course?.courseName ?? "";
  const roleLabel = formatRoleLabel(application.role?.roleName ?? "tutor");
  const headline = [courseCode, roleLabel].filter(Boolean).join(" · ");
  const candidateUserId = person.userId;
  const candidateOnline = useUserPresence(candidateUserId);

  return (
    <div className={styles.intro} aria-label="Conversation with candidate">
      <div className={styles.avatarWrap}>
        <ConversationAvatar
          person={person}
          variant="you"
          size={64}
          className={styles.avatar}
        />
        {candidateUserId != null && candidateOnline ? (
          <span
            className={styles.onlineDot}
            title={`${candidateDisplayName} is online`}
            aria-label={`${candidateDisplayName} is online`}
          />
        ) : null}
      </div>
      <div className={styles.text}>
        <h2 className={styles.name}>{candidateDisplayName}</h2>
        {headline ? <p className={styles.headline}>{headline}</p> : null}
        {courseName ? <p className={styles.subline}>{courseName}</p> : null}
      </div>
    </div>
  );
};

export default CandidateChatIntro;
