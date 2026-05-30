"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import { getCourseLecturerName } from "@/shared/utils/courseLecturer";
import { formatApplicationApplicantDisplayName } from "@/shared/utils/personDisplayName";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import ConversationAvatar from "./ConversationAvatar";
import {
  getCandidateAvatarPerson,
  getLecturerAvatarPerson,
  type AvatarPerson,
} from "./conversationUtils";
import metaStyles from "./applicationMeta.module.css";

function formatRoleLabel(roleName: string) {
  return roleName === "tutor" ? "Tutor" : "Lab Assistant";
}

const formatAppliedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });

interface PartyCardProps {
  heading: string;
  headingId: string;
  person: AvatarPerson;
  avatarVariant: "you" | "lecturer" | "default";
  primaryLine: React.ReactNode;
  secondaryLine: React.ReactNode;
}

function PartyCard({
  heading,
  headingId,
  person,
  avatarVariant,
  primaryLine,
  secondaryLine,
}: PartyCardProps) {
  return (
    <section className={metaStyles.partyBox} aria-labelledby={headingId}>
      <h4 className={metaStyles.partyHeading} id={headingId}>
        {heading}
      </h4>
      <div className={metaStyles.partyBody}>
        <ConversationAvatar
          person={person}
          variant={avatarVariant}
          className={metaStyles.partyAvatar}
          size={44}
        />
        <div className={metaStyles.partyLines}>
          <p className={metaStyles.partyPrimary}>{primaryLine}</p>
          <p className={metaStyles.partySecondary}>{secondaryLine}</p>
        </div>
      </div>
    </section>
  );
}

interface ApplicationDetailMetaProps {
  application: ApplicationResponse;
  className?: string;
}

const ApplicationDetailMeta: React.FC<ApplicationDetailMetaProps> = ({
  application,
  className,
}) => {
  const { user } = useAuth();
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
  const courseCode = application.course?.courseCode;
  const courseName = application.course?.courseName;
  const semester = application.course?.semester;

  const fromPerson = getCandidateAvatarPerson(
    application,
    user
      ? {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          avatarUrl: user.avatarUrl,
        }
      : null
  );

  const toPerson =
    getLecturerAvatarPerson(application) ?? {
      firstName: lecturerName ?? "Lecturer",
      email: "",
      userType: "lecturer",
    };

  const roleLabel = formatRoleLabel(application.role.roleName);
  const appliedLabel = formatAppliedDate(application.appliedAt);

  return (
    <div
      className={`${metaStyles.partyGrid} ${className ?? ""}`}
      aria-label="Application overview"
    >
      <div className={metaStyles.partyFlow}>
        <PartyCard
        heading="From"
        headingId="meta-from-heading"
        person={fromPerson}
        avatarVariant="you"
        primaryLine={applicantName ?? "—"}
        secondaryLine={
          <>
            <span className={metaStyles.partySecondaryStrong}>{roleLabel}</span>
            <span className={metaStyles.partyDot} aria-hidden>
              ·
            </span>
            <span className={metaStyles.partySecondaryLabel}>Applied</span>{" "}
            <time dateTime={application.appliedAt}>{appliedLabel}</time>
          </>
        }
      />

        <div className={metaStyles.partyBridge} aria-hidden>
          <span className={metaStyles.partyBridgeRail} />
          <span className={metaStyles.partyBridgeIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v12m0 0l-4-4m4 4l4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <PartyCard
        heading="To"
        headingId="meta-to-heading"
        person={toPerson}
        avatarVariant="lecturer"
        primaryLine={
          lecturerName ?? (
            <span className={metaStyles.muted}>Not assigned yet</span>
          )
        }
        secondaryLine={
          courseCode ? (
            <>
              <span className={metaStyles.partySecondaryStrong}>
                {courseCode}
                {courseName ? (
                  <span className={metaStyles.courseSub}>
                    {" "}
                    · {courseName}
                  </span>
                ) : null}
              </span>
              {semester ? (
                <>
                  <span className={metaStyles.partyDot} aria-hidden>
                    ·
                  </span>
                  <span>{semester}</span>
                </>
              ) : null}
            </>
          ) : (
            "—"
          )
        }
        />
      </div>
    </div>
  );
};

export default ApplicationDetailMeta;
