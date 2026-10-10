"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { useUserPresence } from "@/shared/hooks/useUserPresence";
import ConversationAvatar from "@/modules/tutor/components/application-detail/ConversationAvatar";
import {
  getCandidateAvatarPerson,
  getCandidateFormattedName,
} from "@/modules/tutor/components/application-detail/conversationUtils";
import { formatRoleLabel } from "@/shared/utils/applicationFormat";
import styles from "./CandidateChatIntro.module.css";

interface CandidateChatIntroProps {
  application: ApplicationResponse;
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
    <div className={styles.candidateChatIntro__intro} aria-label="Conversation with candidate">
      <div className={styles.candidateChatIntro__avatarWrap}>
        <ConversationAvatar
          person={person}
          variant="you"
          size={64}
          className={styles.candidateChatIntro__avatar}
        />
        {candidateUserId != null && candidateOnline ? (
          <span
            className={styles.candidateChatIntro__onlineDot}
            title={`${candidateDisplayName} is online`}
            aria-label={`${candidateDisplayName} is online`}
          />
        ) : null}
      </div>
      <div className={styles.candidateChatIntro__text}>
        <h2 className={styles.candidateChatIntro__name}>{candidateDisplayName}</h2>
        {headline ? <p className={styles.candidateChatIntro__headline}>{headline}</p> : null}
        {courseName ? <p className={styles.candidateChatIntro__subline}>{courseName}</p> : null}
      </div>
    </div>
  );
};

export default CandidateChatIntro;
