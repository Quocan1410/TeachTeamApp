"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import {
  formatConversationTimestamp,
  getCandidateAvatarPerson,
  getCandidateFormattedName,
  type AvatarPerson,
} from "./conversationUtils";
import ConversationAvatar from "./ConversationAvatar";
import { formatRoleLabel } from "@/shared/utils/applicationFormat";
import styles from "./ConversationPanel.module.css";

interface ConversationApplicationBlockProps {
  application: ApplicationResponse;
  authUser?: AvatarPerson | null;
}

const ConversationApplicationBlock: React.FC<
  ConversationApplicationBlockProps
> = ({ application, authUser }) => {
  const avatarPerson = getCandidateAvatarPerson(application, authUser);
  const senderName = getCandidateFormattedName(application, authUser);
  const skills = application.skills
    ?.split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  const roleLabel = formatRoleLabel(application.role?.roleName ?? "tutor");
  const courseCode = application.course?.courseCode ?? "";

  return (
    <article className={styles.conversationPanel__applicationBlock} aria-label="Your application">
      <div className={styles.conversationPanel__messageRow}>
        <ConversationAvatar person={avatarPerson} variant="you" />
        <div className={styles.conversationPanel__messageMain}>
          <div className={styles.conversationPanel__messageHead}>
            <div className={styles.conversationPanel__messageHeadMain}>
              <span className={styles.conversationPanel__messageName}>{senderName}</span>
              <span className={styles.conversationPanel__messageMeta}>
                · Application submitted ·{" "}
                <time dateTime={application.appliedAt}>
                  {formatConversationTimestamp(application.appliedAt)}
                </time>
              </span>
            </div>
          </div>

          <p className={styles.conversationPanel__applicationHeadline}>
            {[courseCode, roleLabel].filter(Boolean).join(" · ")}
          </p>

          <p className={styles.conversationPanel__applicationDetailLine}>
            <span className={styles.conversationPanel__applicationLabel}>Availability · </span>
            {application.availability?.type ?? "—"}
          </p>

          {skills ? (
            <p className={styles.conversationPanel__applicationDetailLine}>
              <span className={styles.conversationPanel__applicationLabel}>Skills · </span>
              {skills}
            </p>
          ) : null}

          {application.motivation?.trim() ? (
            <p className={styles.conversationPanel__applicationDetailLine}>
              <span className={styles.conversationPanel__applicationLabel}>Motivation · </span>
              {application.motivation}
            </p>
          ) : null}

          {application.experience?.trim() ? (
            <p className={styles.conversationPanel__applicationDetailLine}>
              <span className={styles.conversationPanel__applicationLabel}>Experience · </span>
              {application.experience}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ConversationApplicationBlock;
