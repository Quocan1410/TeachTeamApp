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
import styles from "./ConversationPanel.module.css";

interface ConversationApplicationBlockProps {
  application: ApplicationResponse;
  authUser?: AvatarPerson | null;
}

function formatRoleLabel(roleName: string) {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
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
    <article className={styles.applicationBlock} aria-label="Your application">
      <div className={styles.messageRow}>
        <ConversationAvatar person={avatarPerson} variant="you" />
        <div className={styles.messageMain}>
          <div className={styles.messageHead}>
            <div className={styles.messageHeadMain}>
              <span className={styles.messageName}>{senderName}</span>
              <span className={styles.messageMeta}>
                · Application submitted ·{" "}
                <time dateTime={application.appliedAt}>
                  {formatConversationTimestamp(application.appliedAt)}
                </time>
              </span>
            </div>
          </div>

          <p className={styles.applicationHeadline}>
            {[courseCode, roleLabel].filter(Boolean).join(" · ")}
          </p>

          <p className={styles.applicationDetailLine}>
            <span className={styles.applicationLabel}>Availability · </span>
            {application.availability?.type ?? "—"}
          </p>

          {skills ? (
            <p className={styles.applicationDetailLine}>
              <span className={styles.applicationLabel}>Skills · </span>
              {skills}
            </p>
          ) : null}

          {application.motivation?.trim() ? (
            <p className={styles.applicationDetailLine}>
              <span className={styles.applicationLabel}>Motivation · </span>
              {application.motivation}
            </p>
          ) : null}

          {application.experience?.trim() ? (
            <p className={styles.applicationDetailLine}>
              <span className={styles.applicationLabel}>Experience · </span>
              {application.experience}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default ConversationApplicationBlock;
