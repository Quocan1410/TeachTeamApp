"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import {
  getApplicationStatusLabel,
  resolveApplicationStatusDisplay,
} from "@/shared/utils/applicationStatus";
import { getCourseLecturerName } from "@/shared/utils/courseLecturer";
import { formatApplicationApplicantDisplayName } from "@/shared/utils/personDisplayName";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import styles from "./ApplicationDetailPanel.module.css";
import ApplicationDetailHeroActions from "./ApplicationDetailHeroActions";

function formatRoleLabel(roleName: string) {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
}

const formatAppliedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function getHeroStatusValueClass(
  status: ApplicationResponse["status"],
  isWithdrawn?: boolean
): string {
  if (isWithdrawn) return styles.heroStatusWithdrawn;
  if (status === "selected") return styles.heroStatusSelected;
  if (status === "rejected") return styles.heroStatusRejected;
  return styles.heroStatusPending;
}

interface ApplicationDetailHeroProps {
  application: ApplicationResponse;
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  className?: string;
  compact?: boolean;
  /** Hide course code/title/description (e.g. already shown in card stack). */
  metaOnly?: boolean;
  hideActions?: boolean;
}

const ApplicationDetailHero: React.FC<ApplicationDetailHeroProps> = ({
  application,
  isPinned,
  onTogglePin,
  onClose,
  className,
  compact = false,
  metaOnly = false,
  hideActions = false,
}) => {
  const { user } = useAuth();
  const statusDisplay = resolveApplicationStatusDisplay(
    application.status,
    application,
    "candidate"
  );
  const lecturerName = getCourseLecturerName(application.course);
  const applicantName = formatApplicationApplicantDisplayName(
    application,
    user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
        }
      : null
  );

  return (
    <header
      className={`${styles.hero} ${compact ? styles.heroCompact : ""} ${metaOnly ? styles.heroMetaOnly : ""} ${className ?? ""}`}
    >
      <div className={styles.heroMain}>
        {!metaOnly && (
          <>
            <p className={styles.heroEyebrow}>
              <span className={styles.heroCode}>
                {application.course.courseCode}
              </span>
              <span className={styles.heroEyebrowDot} aria-hidden>
                ·
              </span>
              <span className={styles.heroSemester}>
                {application.course.semester}
              </span>
            </p>

            <h2 className={styles.heroTitle}>
              {application.course.courseName}
            </h2>

            <p className={styles.heroDescription}>
              {application.course.description || "No description available."}
            </p>
          </>
        )}

        <p className={styles.heroMetaLine}>
          {applicantName && (
            <>
              <span className={styles.heroMetaLabel}>Applicant</span>
              <span className={styles.heroMetaValue}>{applicantName}</span>
              <span className={styles.heroEyebrowDot} aria-hidden>
                ·
              </span>
            </>
          )}
          <span className={styles.heroMetaLabel}>Lecturer</span>
          <span
            className={
              lecturerName ? styles.heroMetaValue : styles.heroMetaMuted
            }
          >
            {lecturerName ?? "Not assigned yet"}
          </span>
        </p>

        <p className={styles.heroMetaLine}>
          <span className={styles.heroMetaLabel}>Role</span>
          <span className={styles.heroMetaValue}>
            {formatRoleLabel(application.role.roleName)}
          </span>
          <span className={styles.heroEyebrowDot} aria-hidden>
            ·
          </span>
          <span className={styles.heroMetaLabel}>Applied</span>
          <span className={styles.heroMetaValue}>
            <time dateTime={application.appliedAt}>
              {formatAppliedDate(application.appliedAt)}
            </time>
          </span>
          <span className={styles.heroEyebrowDot} aria-hidden>
            ·
          </span>
          <span className={styles.heroMetaLabel}>Status</span>
          <span
            className={`${styles.heroMetaValue} ${getHeroStatusValueClass(
              application.status,
              application.isWithdrawn
            )}`}
          >
            {getApplicationStatusLabel(
              application.status,
              application.isWithdrawn,
              false,
              false,
              false,
              statusDisplay.isReviewed
            )}
          </span>
        </p>
      </div>
      {!hideActions && (
        <ApplicationDetailHeroActions
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onClose={onClose}
        />
      )}
    </header>
  );
};

export default ApplicationDetailHero;
