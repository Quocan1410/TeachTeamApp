"use client";

import React from "react";
import type { Application as TutorApplication } from "@/shared/types/application"; // Updated
import ApplicantAvatar from "./ApplicantAvatar";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./applicant-list.module.css";

// Extended interface to support role information if available
interface ExtendedApplication extends TutorApplication {
  role?: {
    roleName: string;
  };
  course?: {
    courseCode: string;
  };
}

interface ApplicantListProps {
  applications: TutorApplication[];
  selectedApplication: TutorApplication | null;
  onSelectApplication: (app: TutorApplication) => void;
  onRemoveBlockedApplication?: (app: TutorApplication) => void;
  title?: string;
}

// Memoized individual applicant item to prevent unnecessary re-renders
const ApplicantItem = React.memo<{
  application: TutorApplication;
  isSelected: boolean;
  onSelect: (app: TutorApplication) => void;
  onRemoveBlocked?: (app: TutorApplication) => void;
  index: number;
}>(({ application, isSelected, onSelect, onRemoveBlocked, index }) => {
  // Type guard to check if application has extended properties
  const extendedApp = application as ExtendedApplication;
  // Reduce animation complexity for large lists
  const shouldAnimate = index < 20; // Only animate first 20 items

  // Check if application should show ranking crown

  const itemContent = (
    <div
      className={`${styles.applicantItem} ${isSelected ? styles.selected : ""} ${application.isBlocked ? styles.blocked : ""}`}
      onClick={() => onSelect(application)}
    >
      <ApplicantAvatar
        userId={application.userId}
        email={application.email}
        fullName={application.fullName}
        firstName={application.firstName}
        lastName={application.lastName}
        avatarUrl={application.avatarUrl}
      />      <div className={styles.applicantInfo}>
        <div className={styles.applicantName}>{application.fullName}</div>
        <div className={styles.applicantDetails}>
          {/* Role Information */}
          <div className={styles.roleInfo}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.roleIcon}
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
            {extendedApp.role?.roleName === "tutor"
              ? "Tutor"
              : extendedApp.role?.roleName === "lab_assistant"
                ? "Lab Assistant"
                : "Application"}
          </div>

          {/* Course Information - Only show 1 course code */}
          {extendedApp.course ? (
            <span className={styles.courseCode}>
              {extendedApp.course.courseCode}
            </span>
          ) : application.courses && application.courses.length > 0 ? (
            <span className={styles.courseCode}>{application.courses[0]}</span>
          ) : null}

          <span className={styles.detailItem}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.detailIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {application.availability}
          </span>
        </div>

        <div className={styles.applicantSkills}>
          {application.skills.slice(0, 3).map((skill, skillIndex) => (
            <span key={skillIndex} className={styles.skillBadge}>
              {skill}
            </span>
          ))}
          {application.skills.length > 3 && (
            <span className={styles.moreSkills}>
              +{application.skills.length - 3}
            </span>
          )}
        </div>
      </div>
      {application.rank !== undefined &&
        application.rank !== null &&
        application.rank > 0 &&
        !application.isBlocked && (
          <div
            className={styles.applicantRankedIconContainer}
            title={`Ranked #${application.rank}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.rankedIconItself}
              viewBox="0 0 267.5 267.5"
            >
              <path d="M256.975,100.34c0.041,0.736-0.013,1.485-0.198,2.229l-16.5,66c-0.832,3.325-3.812,5.663-7.238,5.681l-99,0.5 c-0.013,0-0.025,0-0.038,0H35c-3.444,0-6.445-2.346-7.277-5.688l-16.5-66.25c-0.19-0.764-0.245-1.534-0.197-2.289 C4.643,98.512,0,92.539,0,85.5c0-8.685,7.065-15.75,15.75-15.75S31.5,76.815,31.5,85.5c0,4.891-2.241,9.267-5.75,12.158 l20.658,20.814c5.221,5.261,12.466,8.277,19.878,8.277c8.764,0,17.12-4.162,22.382-11.135l33.95-44.984 C119.766,67.78,118,63.842,118,59.5c0-8.685,7.065-15.75,15.75-15.75s15.75,7.065,15.75,15.75c0,4.212-1.672,8.035-4.375,10.864 c0.009,0.012,0.02,0.022,0.029,0.035l33.704,45.108c5.26,7.04,13.646,11.243,22.435,11.243c7.48,0,14.514-2.913,19.803-8.203 l20.788-20.788C238.301,94.869,236,90.451,236,85.5c0-8.685,7.065-15.75,15.75-15.75s15.75,7.065,15.75,15.75 C267.5,92.351,263.095,98.178,256.975,100.34z M238.667,198.25c0-4.142-3.358-7.5-7.5-7.5h-194c-4.142,0-7.5,3.358-7.5,7.5v18 c0,4.142,3.358,7.5,7.5,7.5h194c4.142,0,7.5-3.358,7.5-7.5V198.25z" />
            </svg>
          </div>
        )}
      {(application.selected || application.isShortlisted) &&
        !application.isBlocked && (
        <div
          className={styles.applicantSelectedIconContainer}
          title={
            application.selected
              ? "Final selection confirmed"
              : "Shortlisted"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={styles.statusIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}
      {application.isBlocked && onRemoveBlocked && (
        <button
          type="button"
          className={styles.removeBlockedButton}
          title="Remove unavailable application"
          aria-label={`Remove ${application.fullName} from list`}
          onClick={(event) => {
            event.stopPropagation();
            onRemoveBlocked(application);
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          Remove
        </button>
      )}
      <div className={styles.appliedDate}>
        {new Date(application.dateApplied).toLocaleDateString()}
      </div>
    </div>
  );

  // Only use motion for the first 20 items to reduce complexity
  if (shouldAnimate) {
    return (
      <motion.div
        key={application.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.2,
          delay: index * 0.02,
          ease: "easeOut",
        }}
      >
        {itemContent}
      </motion.div>
    );
  }

  // For items beyond the first 20, use a simple fade-in without stagger
  return (
    <motion.div
      key={application.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      {itemContent}
    </motion.div>
  );
});

ApplicantItem.displayName = "ApplicantItem";

const ApplicantList: React.FC<ApplicantListProps> = ({
  applications,
  selectedApplication,
  onSelectApplication,
  onRemoveBlockedApplication,
  title = "Applicants",
}) => {
  return (
    <div className={styles.applicantListPanel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.applicantListContainer}>
        {applications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className={styles.emptyText}>
              No applications match the current filters.
            </p>
          </div>
        ) : (
          <div className={styles.applicantList}>
            <AnimatePresence mode="sync">
              {applications.map((application, index) => (
                <ApplicantItem
                  key={application.id}
                  application={application}
                  isSelected={selectedApplication?.id === application.id}
                  onSelect={onSelectApplication}
                  onRemoveBlocked={onRemoveBlockedApplication}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ApplicantList);
