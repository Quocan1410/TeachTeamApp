import React, { useState, useEffect } from "react";
import type { Application as TutorApplication } from "@/shared/types/application"; // Updated
import { motion, AnimatePresence } from "framer-motion";
import styles from "./applicant-details.module.css";
import {
  validateLecturerComment,
  sanitizeComment,
  formatValidationErrors,
  DEFAULT_COMMENT_CONFIG,
} from "../../utils/lecturerValidation.utils";
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
  comment: string;
  setComment: (comment: string) => void;
  onSelectApplicant: (selectedCourses: string[]) => Promise<void>;
  onSaveComment: () => Promise<void>;
  onDeleteComment: () => Promise<void>;
  onUnselectApplicant: () => Promise<void>;
  onAddToRanking: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  title?: string;
  courses?: Course[];
}

const ApplicantDetails: React.FC<ApplicantDetailsProps> = ({
  application,
  comment,
  setComment,
  onSelectApplicant,
  onSaveComment,
  onDeleteComment,
  onUnselectApplicant,
  onAddToRanking,
  showToast,
  title = "Applicant Details",
  courses = [],
}) => {
  // Validation states
  const [commentError, setCommentError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lecturerNotes, setLecturerNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  // Note: Course selection logic removed since there's only one course

  // Clear validation errors when application changes
  useEffect(() => {
    setCommentError("");
    setHasUnsavedChanges(false);
    // Note: Course selection reset removed since there's only one course
  }, [application?.id, application]);

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

  // Track unsaved changes
  useEffect(() => {
    const originalComment = application?.comment || "";
    const hasChanges = comment !== originalComment;
    setHasUnsavedChanges(hasChanges);
  }, [comment, application?.comment, application?.id]);

  // Note: Course selection handlers removed since there's only one course

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

  // Handle comment changes with validation
  const handleCommentChange = (value: string) => {
    setComment(value);
    setCommentError(""); // Clear error on change
  };

  // Validate and save comment
  const handleSaveComment = async () => {
    if (!application || isSubmitting) return;

    setIsSubmitting(true);
    setCommentError("");

    try {
      // Sanitize comment
      const sanitizedComment = sanitizeComment(comment);

      // Validate comment
      const validation = validateLecturerComment(sanitizedComment, {
        ...DEFAULT_COMMENT_CONFIG,
        allowEmpty: true,
        minLength: 3,
      });

      if (!validation.isValid) {
        const errorMessages = formatValidationErrors(validation.errors);
        setCommentError(errorMessages[0] || "Invalid comment");
        setIsSubmitting(false);
        return;
      }

      // Update comment value with sanitized version
      if (sanitizedComment !== comment) {
        setComment(sanitizedComment);
      }

      // Call the parent's save function (this should handle the API call)
      await onSaveComment();

      showToast("Comment saved successfully!", "success");
      setHasUnsavedChanges(false);
    } catch {
      setCommentError("Failed to save comment. Please try again.");
      showToast("Failed to save comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (!application.comment) {
      showToast(
        "Please add and save a comment before adding to ranking.",
        "error"
      );
      return;
    }
    onAddToRanking();
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
                  {(application.status as string) === "pending"
                    ? "Pending Review"
                    : (application.status as string) === "selected"
                      ? "Selected"
                      : application.status}
                </span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              {application.selected ? (
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
                  disabled={application.isBlocked}
                >
                  {application.isBlocked
                    ? "Candidate Blocked"
                    : "Select Applicant"}
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.sectionIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Course Applications
            </h4>
            <div className={styles.coursesContainer}>
              {application.courses.map((courseCode) => {
                // Use embedded course information from the extended application object
                const extendedApp = application as TutorApplication & {
                  course?: {
                    courseCode: string;
                    courseName: string;
                    semester: string;
                  };
                  role?: {
                    roleName: string;
                  };
                };

                // Find course data with position information
                const courseData = courses.find(
                  (course) => course.courseCode === courseCode
                );
                const roleName = extendedApp.role?.roleName;

                return (
                  <div key={courseCode} className={styles.courseCard}>
                    <div className={styles.courseCode}>{courseCode}</div>
                    <div className={styles.courseName}>
                      {extendedApp.course?.courseName || "Course not found"}
                    </div>

                    {/* Position Information */}
                    {courseData && roleName && (
                      <div className={styles.positionInfo}>
                        {roleName === "tutor" && (
                          <span className={styles.positionBadge}>
                            Tutors:{" "}
                            {(courseData.maxTutors ?? 0) -
                              (courseData.availableTutors ?? 0)}
                            /{courseData.maxTutors ?? 0}
                          </span>
                        )}
                        {roleName === "lab_assistant" && (
                          <span className={styles.positionBadge}>
                            Lab Assistants:{" "}
                            {(courseData.maxLabAssistants ?? 0) -
                              (courseData.availableLabAssistants ?? 0)}
                            /{courseData.maxLabAssistants ?? 0}
                          </span>
                        )}
                      </div>
                    )}

                    {application.selectedForCourses?.includes(courseCode) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.courseSelectedIcon}
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.sectionIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Experience & Skills
            </h4>
            <div className={styles.experienceSkillsGrid}>
              <div className={styles.previousRolesSection}>
                <h5 className={styles.subsectionTitle}>Previous Roles</h5>
                {application.previousRoles &&
                application.previousRoles.length > 0 ? (
                  <ul className={styles.rolesList}>
                    {application.previousRoles.map((role, index) => (
                      <li key={index} className={styles.roleItem}>
                        {role}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyList}>No previous roles listed</p>
                )}
              </div>

              <div className={styles.skillsSection}>
                <h5 className={styles.subsectionTitle}>Skills</h5>
                <div className={styles.skillsContainer}>
                  {application.skills.map((skill, index) => (
                    <span key={index} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.sectionIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m12 14 6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
              </svg>
              Academic Background
            </h4>
            <div className={styles.academicText}>
              {application.academicCredentials ||
                "No academic credentials provided"}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.sectionIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Candidate feedback (visible to applicant)
            </h4>
            <div className={styles.commentInputContainer}>
              <textarea
                value={comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Add your comments about this applicant..."
                className={`${styles.commentTextarea} ${commentError ? styles.commentTextareaError : ""}`}
                maxLength={1000}
                disabled={isSubmitting}
              />
              <div className={styles.commentMeta}>
                <span className={styles.characterCount}>
                  {comment.length}/1000 characters
                </span>
                {hasUnsavedChanges && (
                  <span className={styles.unsavedIndicator}>
                    • Unsaved changes
                  </span>
                )}
              </div>
              {commentError && (
                <div className={styles.errorMessage}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.errorIcon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {commentError}
                </div>
              )}
            </div>
            <div className={styles.commentActions}>
              <button
                onClick={handleSaveComment}
                disabled={
                  isSubmitting || (!comment.trim() && !application.comment)
                }
                className={`${styles.actionButton} ${styles.addToRankingButton}`}
                style={{ fontSize: "0.875rem" }}
              >
                {isSubmitting ? (
                  <>
                    <svg className={styles.spinner} viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="32"
                        strokeDashoffset="32"
                      >
                        <animate
                          attributeName="strokeDasharray"
                          dur="2s"
                          values="0 32;16 16;0 32;0 32"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="strokeDashoffset"
                          dur="2s"
                          values="0;-16;-32;-32"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Comment"
                )}
              </button>
              {application.comment && (
                <button
                  onClick={onDeleteComment}
                  disabled={isSubmitting}
                  className={`${styles.actionButton} ${styles.unselectButton}`}
                  style={{ fontSize: "0.875rem" }}
                >
                  Delete Comment
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Private lecturer notes</h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.5rem" }}>
              Only you can see these — not sent to the candidate.
            </p>
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
                className={`${styles.actionButton} ${styles.addToRankingButton}`}
                style={{ fontSize: "0.875rem" }}
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
