"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import {
  getApplicationStatusLabel,
  resolveApplicationStatusDisplay,
} from "@/shared/utils/applicationStatus";
import { getCourseLecturerName } from "@/shared/utils/courseLecturer";
import { formatApplicationApplicantDisplayName } from "@/shared/utils/personDisplayName";
import {
  formatAppliedDate,
  formatRoleLabel,
} from "@/shared/utils/applicationFormat";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import styles from "./ApplicationDetailPanel.module.css";
import ApplicationDetailHeroActions from "./ApplicationDetailHeroActions";

function getHeroStatusValueClass(
  status: ApplicationResponse["status"],
  isWithdrawn?: boolean
): string {
  if (isWithdrawn) return styles.applicationDetailPanel__heroStatusWithdrawn;
  if (status === "selected") return styles.applicationDetailPanel__heroStatusSelected;
  if (status === "rejected") return styles.applicationDetailPanel__heroStatusRejected;
  return styles.applicationDetailPanel__heroStatusPending;
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
      className={`${styles.applicationDetailPanel__hero} ${compact ? styles.applicationDetailPanel__heroCompact : ""} ${metaOnly ? styles.applicationDetailPanel__heroMetaOnly : ""} ${className ?? ""}`}
    >
      <div className={styles.applicationDetailPanel__heroMain}>
        {!metaOnly && (
          <>
            <p className={styles.applicationDetailPanel__heroEyebrow}>
              <span className={styles.applicationDetailPanel__heroCode}>
                {application.course.courseCode}
              </span>
              <span className={styles.applicationDetailPanel__heroEyebrowDot} aria-hidden>
                ·
              </span>
              <span className={styles.applicationDetailPanel__heroSemester}>
                {application.course.semester}
              </span>
            </p>

            <h2 className={styles.applicationDetailPanel__heroTitle}>
              {application.course.courseName}
            </h2>

            <p className={styles.applicationDetailPanel__heroDescription}>
              {application.course.description || "No description available."}
            </p>
          </>
        )}

        <p className={styles.applicationDetailPanel__heroMetaLine}>
          {applicantName && (
            <>
              <span className={styles.applicationDetailPanel__heroMetaLabel}>Applicant</span>
              <span className={styles.applicationDetailPanel__heroMetaValue}>{applicantName}</span>
              <span className={styles.applicationDetailPanel__heroEyebrowDot} aria-hidden>
                ·
              </span>
            </>
          )}
          <span className={styles.applicationDetailPanel__heroMetaLabel}>Lecturer</span>
          <span
            className={
              lecturerName ? styles.applicationDetailPanel__heroMetaValue : styles.applicationDetailPanel__heroMetaMuted
            }
          >
            {lecturerName ?? "Not assigned yet"}
          </span>
        </p>

        <p className={styles.applicationDetailPanel__heroMetaLine}>
          <span className={styles.applicationDetailPanel__heroMetaLabel}>Role</span>
          <span className={styles.applicationDetailPanel__heroMetaValue}>
            {formatRoleLabel(application.role.roleName)}
          </span>
          <span className={styles.applicationDetailPanel__heroEyebrowDot} aria-hidden>
            ·
          </span>
          <span className={styles.applicationDetailPanel__heroMetaLabel}>Applied</span>
          <span className={styles.applicationDetailPanel__heroMetaValue}>
            <time dateTime={application.appliedAt}>
              {formatAppliedDate(application.appliedAt)}
            </time>
          </span>
          <span className={styles.applicationDetailPanel__heroEyebrowDot} aria-hidden>
            ·
          </span>
          <span className={styles.applicationDetailPanel__heroMetaLabel}>Status</span>
          <span
            className={`${styles.applicationDetailPanel__heroMetaValue} ${getHeroStatusValueClass(
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
