import React, { useState, useEffect } from "react";
import type { Application as TutorApplication } from "@/shared/types/application"; // Updated
import { motion, AnimatePresence } from "framer-motion";
import styles from "./applicant-details.module.css";
import { ApplicationService } from "@/shared/services/applicationService";

interface Course {
  courseCode: string;
  courseName: string;
  availableTutors?: number;
  availableLabAssistants?: number;
  maxTutors?: number;
  maxLabAssistants?: number;
  selectedTutors?: number;
  selectedLabAssistants?: number;
}

interface ApplicantDetailsProps {
  application: TutorApplication | null;
  onSelectApplicant: (selectedCourses: string[]) => Promise<void>;
  onUnselectApplicant: () => Promise<void>;
  onAddToRanking: () => Promise<void>;
  onRemoveBlockedApplication?: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  title?: string;
  courses?: Course[];
}

const ApplicantDetails: React.FC<ApplicantDetailsProps> = ({
  application,
  onSelectApplicant,
  onUnselectApplicant,
  onAddToRanking,
  onRemoveBlockedApplication,
  showToast,
  title = "Applicant Details",
  courses = [],
}) => {
  const [lecturerNotes, setLecturerNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Note: Course selection logic removed since there's only one course

  useEffect(() => {
    if (!application?.id) {
      setLecturerNotes("");
      return;
    }
    ApplicationService.getLecturerNotes(parseInt(application.id, 10)).then(
      (res) => {
        if (res.success && res.data) {
          setLecturerNotes(res.data.lecturerNotes || "");
        }
      }
    );
  }, [application?.id]);

  if (!application) {
    return (
      <div className={styles.applicantDetailsPanel}>
        <h2 className={styles.panelTitle}>{title}</h2>
        <div className={styles.emptyDetails}>
          <div className={styles.emptyDetailsIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className={styles.emptyDetailsTitle}>No Applicant Selected</h3>
          <p className={styles.emptyDetailsText}>
            Select an applicant from the list to view their details
          </p>
        </div>
      </div>
    );
  }

  // Handle status updates with validation
  const handleSelectButtonClick = () => {
    if (!application) return;

    // Select applicant without any conditions - just select for all their courses
    onSelectApplicant(application.courses);
  };

  const handleAddToRankingClick = () => {
    if (!application.selected) {
      showToast(
        "Please select the applicant before adding to ranking",
        "error"
      );
      return;
    }
    // Fix: Check if truly ranked (rank > 0), handle null/undefined explicitly
    if (
      application.rank !== null &&
      application.rank !== undefined &&
      application.rank > 0
    ) {
      showToast("Applicant is already added to ranking", "info");
      return;
    }
    onAddToRanking();
  };

  const handleRemoveBlockedClick = async () => {
    if (!application?.isBlocked || !onRemoveBlockedApplication) return;

    try {
      setIsRemoving(true);
      await onRemoveBlockedApplication();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className={styles.applicantDetailsPanel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <AnimatePresence mode="wait">
        <motion.div
          key={application.id}
          className={styles.detailsContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {application.isBlocked && (
            <div className={styles.blockedWarning}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.warningIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <strong>Candidate unavailable</strong>
                <p>
                  This applicant was blocked by an administrator. You can remove
                  their application from your list when you no longer need it.
                </p>
              </div>
            </div>
          )}

          <div className={styles.actionButtonsContainer}>
            <div>
              <h2 className={styles.applicantNameLarge}>
                {application.fullName}
              </h2>
              <p className={styles.applicantEmail}>{application.email}</p>
              <div className={styles.applicantBadges}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {((application as any)?.role?.roleName === "tutor" ||
                  application.previousRoles?.includes("tutor")) && (
                  <span className={styles.roleBadge}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.roleBadgeIcon}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {(
                      application as TutorApplication & {
                        role?: { roleName: string };
                      }
                    )?.role?.roleName === "tutor"
                      ? "Tutor"
                      : (
                            application as TutorApplication & {
                              role?: { roleName: string };
                            }
                          )?.role?.roleName === "lab_assistant"
                        ? "Lab Assistant"
                        : "Tutor Applicant"}
                  </span>
                )}

                <span className={styles.availabilityBadge}>
                  {application.availability}
                </span>

                <span className={styles.statusBadge}>
                  {application.isWithdrawn
                    ? "Withdrawn"
                    : (application.status as string) === "pending"
                      ? "Pending Review"
                      : (application.status as string) === "selected"
                        ? "Selected"
                        : application.status}
                </span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              {application.isBlocked ? (
                <button
                  type="button"
                  onClick={handleRemoveBlockedClick}
                  disabled={isRemoving || !onRemoveBlockedApplication}
                  className={`${styles.actionButton} ${styles.removeBlockedButton}`}
                  title="Remove this application from your list"
                >
                  {isRemoving ? "Removing..." : "Remove Application"}
                </button>
              ) : application.selected ? (
                <>
                  <button
                    onClick={onUnselectApplicant}
                    className={`${styles.actionButton} ${styles.unselectButton}`}
                  >
                    Unselect
                  </button>
                  {application.rank !== null &&
                  application.rank !== undefined &&
                  application.rank > 0 ? (
                    <button
                      disabled
                      className={`${styles.actionButton} ${styles.alreadyRankedButton}`}
                      title="Already added to ranking"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.buttonIcon}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Added to Ranking
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToRankingClick}
                      className={`${styles.actionButton} ${styles.addToRankingButton}`}
                      title="Add to ranking"
                    >
                      Add to Ranking
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleSelectButtonClick}
                  className={`${styles.actionButton} ${styles.selectButton}`}
                  title="Select applicant for all applied courses"
                  disabled={
                    application.isBlocked || Boolean(application.isWithdrawn)
                  }
                >
                  {application.isBlocked
                    ? "Candidate Blocked"
                    : "Select Applicant"}
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Course Applications</h4>
            <div className={styles.compactCourseList}>
              {application.courses.map((courseCode) => {
                const extendedApp = application as TutorApplication & {
                  course?: {
                    courseCode: string;
                    courseName: string;
                    semester: string;
                  };
                  role?: { roleName: string };
                };
                const courseData = courses.find(
                  (course) => course.courseCode === courseCode
                );
                const roleName = extendedApp.role?.roleName;
                const isSelected =
                  application.selectedForCourses?.includes(courseCode);

                return (
                  <div key={courseCode} className={styles.compactCourseRow}>
                    <span className={styles.courseCode}>{courseCode}</span>
                    <span className={styles.compactCourseName}>
                      {extendedApp.course?.courseName || "Course not found"}
                    </span>
                    {courseData && roleName && (
                      <span className={styles.positionBadge}>
                        {roleName === "tutor"
                          ? `Tutors ${(courseData.maxTutors ?? 0) - (courseData.availableTutors ?? 0)}/${courseData.maxTutors ?? 0}`
                          : `Lab ${(courseData.maxLabAssistants ?? 0) - (courseData.availableLabAssistants ?? 0)}/${courseData.maxLabAssistants ?? 0}`}
                      </span>
                    )}
                    {isSelected && (
                      <span className={styles.compactSelectedMark} title="Selected">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Experience & Skills</h4>
            <div className={styles.compactMetaGrid}>
              <div className={styles.compactMetaBlock}>
                <span className={styles.compactLabel}>Previous roles</span>
                {application.previousRoles &&
                application.previousRoles.length > 0 ? (
                  <div className={styles.inlineTags}>
                    {application.previousRoles.map((role, index) => (
                      <span key={index} className={styles.inlineTag}>
                        {role}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.emptyInline}>None listed</span>
                )}
              </div>
              <div className={styles.compactMetaBlock}>
                <span className={styles.compactLabel}>Skills</span>
                <div className={styles.inlineTags}>
                  {application.skills.map((skill, index) => (
                    <span key={index} className={styles.inlineTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Academic Background</h4>
            <p className={styles.academicText}>
              {application.academicCredentials ||
                "No academic credentials provided"}
            </p>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Private notes</h4>
            <p className={styles.notesHint}>Only visible to you.</p>
            <textarea
              value={lecturerNotes}
              onChange={(e) => setLecturerNotes(e.target.value)}
              placeholder="Internal notes, interview reminders…"
              className={styles.commentTextarea}
              maxLength={2000}
              disabled={notesSaving}
            />
            <div className={styles.commentActions}>
              <button
                type="button"
                onClick={async () => {
                  if (!application?.id) return;
                  setNotesSaving(true);
                  try {
                    const res = await ApplicationService.updateLecturerNotes(
                      parseInt(application.id, 10),
                      lecturerNotes
                    );
                    if (res.success) {
                      showToast("Private notes saved", "success");
                    } else {
                      showToast(res.message || "Failed to save notes", "error");
                    }
                  } finally {
                    setNotesSaving(false);
                  }
                }}
                disabled={notesSaving}
                className={`${styles.actionButton} ${styles.addToRankingButton} ${styles.notesSaveBtn}`}
              >
                {notesSaving ? "Saving…" : "Save private notes"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ApplicantDetails;
