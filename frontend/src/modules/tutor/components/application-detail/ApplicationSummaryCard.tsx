"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import ApplicationStatusBadge from "@/shared/components/common/application-status-badge/ApplicationStatusBadge";
import { getCourseLecturerName } from "@/shared/utils/courseLecturer";
import {
  formatAppliedDate,
  formatRoleLabel,
} from "@/shared/utils/applicationFormat";
import {
  formatApplicationApplicantDisplayName,
  formatLecturerDisplayName,
} from "@/shared/utils/personDisplayName";
import { resolveApplicationStatusDisplay } from "@/shared/utils/applicationStatus";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import styles from "./ApplicationSummaryCard.module.css";

function RoleIcon({ roleName }: { roleName: string }) {
  if (roleName === "tutor") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface ApplicationSummaryCardProps {
  application: ApplicationResponse;
  className?: string;
  /** Lecturer detail panel: role-focused subtitle and screening actions */
  variant?: "default" | "lecturer";
  screeningActions?: React.ReactNode;
}

const ApplicationSummaryCard: React.FC<ApplicationSummaryCardProps> = ({
  application,
  className,
  variant = "default",
  screeningActions,
}) => {
  const { user } = useAuth();
  const isLecturerView = variant === "lecturer";
  const statusDisplay = resolveApplicationStatusDisplay(
    application.status,
    application,
    isLecturerView ? "lecturer" : "candidate"
  );
  const courseLecturerName = getCourseLecturerName(application.course);
  const viewerLecturerName =
    user?.userType === "lecturer"
      ? formatLecturerDisplayName(
          {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
          },
          "You"
        )
      : null;
  const lecturerName = isLecturerView
    ? viewerLecturerName ?? courseLecturerName
    : courseLecturerName;
  const roleLabel = formatRoleLabel(application.role.roleName);
  const subtitle = isLecturerView
    ? statusDisplay.isCandidateBlocked
      ? `${roleLabel} application · Candidate blocked by admin`
      : `${roleLabel} application`
    : application.course.description || "No description available.";
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
  const applicantEmail =
    application.candidate?.email ?? user?.email ?? null;
  const isTutor = application.role.roleName === "tutor";

  return (
    <article
      className={`${styles.card} ${className ?? ""}`}
      aria-label="Application summary"
    >
      <div className={styles.body}>
        <div className={styles.rowTop}>
          <p className={styles.eyebrow}>
            <span className={styles.courseCode}>
              {application.course.courseCode}
            </span>
            <span className={styles.eyebrowDot} aria-hidden>
              ·
            </span>
            <span>{application.course.semester}</span>
          </p>
          <div className={styles.statusWrap}>
            <ApplicationStatusBadge
              status={application.status}
              isWithdrawn={application.isWithdrawn}
              isCandidateBlocked={statusDisplay.isCandidateBlocked}
              isShortlisted={statusDisplay.isShortlisted}
              isRanked={statusDisplay.isRanked}
              isReviewed={statusDisplay.isReviewed}
            />
          </div>
        </div>

        <h2 className={styles.title}>{application.course.courseName}</h2>
        <p
          className={`${styles.description} ${
            isLecturerView ? styles.descriptionLecturer : ""
          }`}
        >
          {subtitle}
        </p>

        <div className={styles.people}>
          <div className={styles.personRow}>
            <span className={styles.personLabel}>Applicant</span>
            <div className={styles.personValue}>
              <span className={styles.personName}>
                {applicantName ?? "—"}
              </span>
              {applicantEmail ? (
                <span className={styles.personMeta}>{applicantEmail}</span>
              ) : null}
            </div>
          </div>
          {!isLecturerView && (
            <div className={styles.personRow}>
              <span className={styles.personLabel}>Lecturer</span>
              <div className={styles.personValue}>
                <span className={styles.personName}>
                  {lecturerName ?? (
                    <span className={styles.personMuted}>Not assigned yet</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {screeningActions ? (
          <div className={styles.screeningBlock} aria-label="Screening">
            <span className={styles.screeningLabel}>Screening</span>
            {screeningActions}
          </div>
        ) : null}

        <div className={styles.rowBottom}>
          <div
            className={`${styles.role} ${
              isTutor ? styles.roleTutor : styles.roleAssistant
            }`}
          >
            <span className={styles.roleIcon} aria-hidden>
              <RoleIcon roleName={application.role.roleName} />
            </span>
            <span className={styles.roleLabel}>
              {formatRoleLabel(application.role.roleName)}
            </span>
          </div>
          <p className={styles.date}>
            Applied {formatAppliedDate(application.appliedAt)}
          </p>
        </div>
      </div>
    </article>
  );
};

export default ApplicationSummaryCard;
