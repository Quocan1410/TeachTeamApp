import React from "react";
import { motion } from "framer-motion";
import type { CourseDetails } from "@/shared/types/courseTypes";
import {
  Course,
  Role,
  ApplicationResponse,
} from "@/shared/services/applicationService";
import { availableSkills } from "@/modules/tutor/utils/skillOptions";
import SkillTag from "@/modules/tutor/components/skill-tag/skill-tag";
import styles from "./course-card.module.css";

// Legacy interface
interface CourseCardProps {
  course: CourseDetails;
  openApplyModal: (course: CourseDetails) => void;
  hasApplied?: boolean;
}

// Enhanced interface
interface EnhancedCourseCardProps {
  course: Course;
  roles: Role[];
  myApplications: ApplicationResponse[];
  onApplyForRole: (course: Course, role: Role) => void;
}

// Combined interface to support both legacy and new usage
type CombinedCourseCardProps = CourseCardProps | EnhancedCourseCardProps;

const CourseCard: React.FC<CombinedCourseCardProps> = (props) => {
  // Type guards to determine which interface we're using
  const isLegacyProps = (
    props: CombinedCourseCardProps
  ): props is CourseCardProps => {
    return "openApplyModal" in props;
  };

  const isEnhancedProps = (
    props: CombinedCourseCardProps
  ): props is EnhancedCourseCardProps => {
    return "roles" in props;
  };

  // Legacy props
  const legacyProps = isLegacyProps(props) ? props : null;
  const enhancedProps = isEnhancedProps(props) ? props : null;

  // Extract data based on props type
  const course = props.course;
  const roles = enhancedProps?.roles || [];
  const myApplications = enhancedProps?.myApplications || [];
  const hasApplied = legacyProps?.hasApplied || false;

  // Enhanced functionality: Check if user has applied for a specific role in this course
  const getApplicationStatus = (roleId: number) => {
    const application = myApplications.find(
      (app) => app.courseId === (course as Course).id && app.roleId === roleId
    );
    return application?.status || null;
  };

  // Enhanced functionality: Get suggested skills for this course
  const getSuggestedSkills = () => {
    const courseCode = legacyProps
      ? (course as CourseDetails).code.toLowerCase()
      : (course as Course).courseCode.toLowerCase();

    if (courseCode.includes("cosc") || courseCode.includes("comp")) {
      return ["Programming", "Problem Solving", "Communication"];
    }
    return ["Teaching", "Communication", "Organization"];
  };

  // Enhanced functionality: Limit skills display to maximum 2 skills
  const renderSkills = () => {
    let skills: string[];

    if (legacyProps) {
      // Legacy mode: use course skills or available skills
      skills = (course as CourseDetails).skills || availableSkills.slice(0, 2);
    } else {
      // Enhanced mode: use suggested skills
      skills = getSuggestedSkills();
    }

    const displaySkills = skills.slice(0, 2);
    const hasMoreSkills = skills.length > 2;

    return (
      <div className={styles.skillsWrapper}>
        {displaySkills.map((skill, index) => (
          <SkillTag key={index} skill={skill} />
        ))}
        {hasMoreSkills && (
          <span
            className={styles.moreSkillsIndicator}
            tabIndex={0}
            role="button"
            aria-label={`${skills.length - 2} more skills available`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
              }
            }}
          >
            ...
          </span>
        )}
      </div>
    );
  };

  // Legacy functionality: Status indicators based on availability and whether user has applied
  const getStatusInfo = () => {
    if (legacyProps && hasApplied) {
      return {
        label: "Applied",
        bgClass: styles.bgGreen100,
        textClass: styles.textGreen800,
      };
    }

    const availability = legacyProps
      ? (course as CourseDetails).availability
      : "Full Time"; // Default for enhanced mode

    return {
      label: availability,
      bgClass:
        availability === "Full Time" ? styles.bgBlue100 : styles.bgPurple100,
      textClass:
        availability === "Full Time"
          ? styles.textBlue800
          : styles.textPurple800,
    };
  };

  const statusInfo = getStatusInfo();

  if (enhancedProps) {
    // Enhanced rendering
    return (
      <motion.div
        className={styles.enhancedCourseCard}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        {/* Card Header */}
        <div className={styles.cardHeader}>
          <span className={styles.courseCode}>
            {(course as Course).courseCode}
          </span>
          <span className={styles.semester}>{(course as Course).semester}</span>
        </div>

        {/* Card Body */}
        <div className={styles.cardBody}>
          <h3 className={styles.courseTitle}>
            {(course as Course).courseName}
          </h3>

          {/* Course Description Section */}
          <div className={styles.descriptionContainer}>
            <span className={styles.descriptionLabel}>Course Description:</span>
            <p className={styles.courseDescription}>
              {(course as Course).description || "No description available."}
            </p>
          </div>
        </div>

        {/* Available Positions Section */}
        <div className={styles.roleSection}>
          <h4 className={styles.roleSectionTitle}>Available Positions</h4>

          <div className={styles.roleContent}>
            {(() => {
              // Filter roles to show individually based on their specific availability
              const availableRoles: Role[] = [];
              const unavailableRoles: Role[] = [];

              roles.forEach((role) => {
                // Check if user has already applied for this role
                const applicationStatus = getApplicationStatus(role.id);

                // If user has applied, always show the role (they should see their status)
                if (applicationStatus) {
                  availableRoles.push(role);

                  return;
                }

                // If user hasn't applied, check if positions are available for this specific role
                const availablePositions =
                  role.roleName === "tutor"
                    ? (course as Course).availableTutors !== undefined
                      ? (course as Course).availableTutors
                      : (course as Course).maxTutors
                    : (course as Course).availableLabAssistants !== undefined
                      ? (course as Course).availableLabAssistants
                      : (course as Course).maxLabAssistants;

                if (availablePositions! > 0) {
                  availableRoles.push(role);
                } else {
                  unavailableRoles.push(role);
                }
              });

              // Always show roles that are available or user has applied to
              const rolesToShow = availableRoles;

              // If no roles are available for application and user hasn't applied to any, show disabled state
              if (rolesToShow.length === 0 && unavailableRoles.length > 0) {
                return (
                  <div className={styles.noPositionsContainer}>
                    <div className={styles.noPositionsText}></div>
                    <motion.button
                      className={styles.applyButtonDisabled}
                      disabled
                    >
                      No Positions Available
                    </motion.button>
                  </div>
                );
              }

              return rolesToShow.map((role) => {
                const applicationStatus = getApplicationStatus(role.id);
                // Always show total positions for display
                const maxPositions =
                  role.roleName === "tutor"
                    ? (course as Course).maxTutors
                    : (course as Course).maxLabAssistants;

                // Check available positions for apply button state
                const availablePositions =
                  role.roleName === "tutor"
                    ? (course as Course).availableTutors !== undefined
                      ? (course as Course).availableTutors
                      : (course as Course).maxTutors
                    : (course as Course).availableLabAssistants !== undefined
                      ? (course as Course).availableLabAssistants
                      : (course as Course).maxLabAssistants;

                return (
                  <div key={role.id} className={styles.roleOption}>
                    <div className={styles.roleHeader}>
                      <div className={styles.roleInfo}>
                        <div className={styles.roleIconWrapper}>
                          <div
                            className={`${styles.roleIcon} ${
                              role.roleName === "tutor"
                                ? styles.roleIconTutor
                                : styles.roleIconAssistant
                            }`}
                          >
                            {role.roleName === "tutor" ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className={styles.roleDetails}>
                          <span className={styles.roleName}>
                            {role.roleName === "tutor"
                              ? "Tutor"
                              : "Lab Assistant"}
                          </span>
                          <span className={styles.rolePositions}>
                            {maxPositions} positions
                          </span>
                        </div>
                      </div>

                      {/* Status or Apply Button */}
                      <div className={styles.roleAction}>
                        {applicationStatus ? (
                          <div
                            className={`${styles.statusBadge} ${styles[`status-${applicationStatus}`]}`}
                          >
                            <div className={styles.statusIcon}>
                              {applicationStatus === "pending" && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              {applicationStatus === "selected" && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              {applicationStatus === "rejected" && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className={styles.statusText}>
                              {applicationStatus.charAt(0).toUpperCase() +
                                applicationStatus.slice(1)}
                            </span>
                          </div>
                        ) : availablePositions! > 0 ? (
                          <motion.button
                            className={styles.applyButton}
                            onClick={() =>
                              enhancedProps.onApplyForRole(
                                course as Course,
                                role
                              )
                            }
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Apply
                          </motion.button>
                        ) : (
                          <button
                            className={styles.applyButtonDisabled}
                            disabled
                          >
                            Filled
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      </motion.div>
    );
  }

  // Legacy rendering
  return (
    <div className={styles.enhancedCourseCard}>
      {/* Card top section with code and status */}
      <div className={styles.cardTop}>
        <span className={styles.courseCode}>
          {(course as CourseDetails).code}
        </span>
        <span
          className={`${styles.courseStatus} ${statusInfo.bgClass} ${statusInfo.textClass}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>
        <h3 className={styles.courseTitle}>{(course as CourseDetails).name}</h3>

        {/* Skills tags */}
        <div className={styles.skillsContainer}>{renderSkills()}</div>

        {/* Role tag */}
        <div className={styles.roleTag}>
          <div
            className={`${styles.roleIcon} ${
              (course as CourseDetails).role === "Tutor"
                ? styles.roleIconTutor
                : styles.roleIconAssistant
            }`}
          >
            {(course as CourseDetails).role === "Tutor" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span className={styles.roleName}>
            {(course as CourseDetails).role}
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className={styles.cardFooter}>
        {!hasApplied ? (
          <motion.button
            className={styles.applyButton}
            onClick={() => legacyProps!.openApplyModal(course as CourseDetails)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Apply Now
          </motion.button>
        ) : (
          <div className={styles.appliedStatus}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Application Submitted</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
