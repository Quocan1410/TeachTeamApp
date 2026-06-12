import React from "react";
import type { Application as TutorApplication } from "@/shared/types/application"; // Updated
import { motion } from "framer-motion";
import styles from "./ranked-candidates.module.css";

interface CourseSlotInfo {
  maxTutors?: number;
  maxLabAssistants?: number;
  selectedTutors?: number;
  selectedLabAssistants?: number;
  availableTutors?: number;
  availableLabAssistants?: number;
}

interface RankedCandidatesProps {
  rankedApplications: TutorApplication[];
  selectedCourse: string;
  onMoveUp: (app: TutorApplication) => void;
  onMoveDown: (app: TutorApplication) => void;
  onRemove: (id: string) => void;
  title?: string;
  showCourseFilter?: boolean;
  onCourseChange?: (course: string) => void;
  availableCourses?: { code: string; name: string }[];
  courseSlotInfo?: CourseSlotInfo | null;
}

const RankedCandidates: React.FC<RankedCandidatesProps> = ({
  rankedApplications,
  selectedCourse,
  onMoveUp,
  onMoveDown,
  onRemove,
  title = "Ranked Candidates",
  courseSlotInfo = null,
}) => {
  // Function to format rank display with proper sequential numbering
  const formatRankDisplay = (index: number) => {
    return (index + 1).toString();
  };

  // Filter and sort ranked applications by course and rank
  const filteredRankedApplications = rankedApplications
    .filter((app) => {
      if (!selectedCourse) {
        return false;
      }

      return (
        app.rankedForCourse === selectedCourse &&
        app.courses.includes(selectedCourse)
      );
    })
    .filter(
      (app) =>
        !app.isBlocked &&
        app.rank !== undefined &&
        app.rank !== null &&
        app.rank > 0
    )
    .sort((a, b) => (a.rank || 0) - (b.rank || 0)); // Sort by rank

  return (
    <div className={styles.rankingsContainer}>
      <h2 className={styles.rankingsTitle}>{title}</h2>



      {/* Course Selection Info */}
      {selectedCourse && courseSlotInfo && (
        <div className={styles.slotSummary}>
          <strong>Position slots</strong>
          <span>
            Tutor: {courseSlotInfo.selectedTutors ?? 0}/
            {courseSlotInfo.maxTutors ?? 0} confirmed
            {(courseSlotInfo.availableTutors ?? 0) > 0
              ? ` · ${courseSlotInfo.availableTutors} open`
              : " · full"}
          </span>
          {(courseSlotInfo.maxLabAssistants ?? 0) > 0 && (
            <span>
              Lab: {courseSlotInfo.selectedLabAssistants ?? 0}/
              {courseSlotInfo.maxLabAssistants ?? 0} confirmed
              {(courseSlotInfo.availableLabAssistants ?? 0) > 0
                ? ` · ${courseSlotInfo.availableLabAssistants} open`
                : " · full"}
            </span>
          )}
          <span className={styles.slotHint}>
            Rankings show shortlist order. Only confirmed final selections use
            slots.
          </span>
        </div>
      )}

      {selectedCourse && (
        <div className={styles.courseInfo}>
          <div className={styles.courseInfoContent}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.courseInfoIcon}
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
            <span>
              Showing rankings for <strong>{selectedCourse}</strong>
            </span>
          </div>
          {filteredRankedApplications.length > 0 && (
            <div className={styles.rankingStats}>
              {filteredRankedApplications.length} candidate{filteredRankedApplications.length !== 1 ? 's' : ''} ranked
            </div>
          )}
        </div>
      )}

      {filteredRankedApplications.length === 0 ? (
        <div className={styles.emptyRankings}>
          <div className={styles.emptyRankingsIcon}>
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className={styles.emptyRankingsTitle}>No Ranked Candidates</h3>
          <p className={styles.emptyRankingsText}>
            {selectedCourse
              ? `No candidates have been ranked for ${selectedCourse} yet.`
              : "Please select a course to view rankings."}
          </p>
          <p className={styles.emptyRankingsHelp}>
            Shortlist an applicant from the Applications tab — they will appear
            here automatically.
          </p>
        </div>
      ) : (
        <div className={styles.rankingsList}>
          {filteredRankedApplications.map((application, index) => (
            <motion.div
              key={application.id}
              className={styles.rankedItem}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className={styles.rankBadge}>
                <span className={styles.rankNumber}>{formatRankDisplay(index)}</span>
              </div>
              <div className={styles.rankedInfo}>
                <div className={styles.rankedHeader}>
                  <div className={styles.rankedName}>{application.fullName}</div>
                  <div className={styles.rankedEmail}>{application.email}</div>
                </div>
                <div className={styles.rankedCourses}>
                  Ranked for:{" "}
                  {application.rankedForCourse ||
                    application.selectedForCourses?.join(", ") ||
                    application.courses.join(", ")}
                </div>
                <div className={styles.rankedSkills}>
                  {application.skills.slice(0, 3).map((skill, skillIndex) => (
                    <span key={skillIndex} className={styles.rankedSkill}>
                      {skill}
                    </span>
                  ))}
                  {application.skills.length > 3 && (
                    <span className={styles.moreSkills}>
                      +{application.skills.length - 3} more
                    </span>
                  )}
                </div>
                {application.comment && (
                  <div className={styles.rankedComment}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.commentIcon}
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
                    <span className={styles.commentText}>
                      {application.comment.length > 100 
                        ? `${application.comment.substring(0, 100)}...` 
                        : application.comment}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.rankedActions}>
                <div className={styles.moveActions}>
                  {index > 0 && (
                    <button
                      onClick={() => onMoveUp(application)}
                      className={`${styles.rankBtn} ${styles.moveUpBtn}`}
                      title="Move up"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                  )}
                  {index < filteredRankedApplications.length - 1 && (
                    <button
                      onClick={() => onMoveDown(application)}
                      className={`${styles.rankBtn} ${styles.moveDownBtn}`}
                      title="Move down"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => onRemove(application.id)}
                  className={`${styles.rankBtn} ${styles.removeBtn}`}
                  title="Remove from ranking"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RankedCandidates;
