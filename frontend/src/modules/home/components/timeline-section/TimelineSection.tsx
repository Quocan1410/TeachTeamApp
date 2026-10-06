import React from "react";
import styles from "./TimelineSection.module.css";
import Link from "next/link";
import buttonStyles from "@/shared/components/common/Button/Button.module.css";

interface TimelineSectionProps {
  isLoggedIn: boolean;
  userRole: string | null;
  // Add any other props needed, e.g., for the link target
}

const TimelineSection: React.FC<TimelineSectionProps> = ({
  isLoggedIn,
  userRole,
}) => {
  return (
    <section
      className={`${styles.timelineSectionWrapper} section`} // Added global section class and wrapper
      id="tutors-info"
    >
      <div className={`${styles.timelineContentContainer} container`}>
        {" "}
        {/* Added global container class */}
        <h2 className={styles.sectionHeading}>How to apply</h2>
        <p className={styles.sectionSubheading}>
          A lecturer posts tutor and lab assistant places on a course. You apply
          for one course and one role, then wait for that lecturer to select a
          candidate.
        </p>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineItem}>
            <div className={styles.timelineTitle}>Create an account</div>
            <div className={styles.timelineDescription}>
              Use your university email. This account is how a lecturer sees
              your name and your applications.
            </div>
            <ul className={styles.timelineFeatures}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>One account for every application</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>University email sign-in</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Your name on each application</span>
              </li>
            </ul>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineTitle}>Apply for one role</div>
            <div className={styles.timelineDescription}>
              Choose tutor or lab assistant on a course that is still open.
              Add your skills and whether you can work part time or full time.
            </div>
            <ul className={styles.timelineFeatures}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>One course and one role</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Skills on the application</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Part time or full time</span>
              </li>
            </ul>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineTitle}>Wait for the selection</div>
            <div className={styles.timelineDescription}>
              The lecturer ranks applicants and selects who fills the place.
              You can see the status of your application.
            </div>
            <ul className={styles.timelineFeatures}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Lecturer ranks the applicants</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Selected candidates fill the places</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>You see the application status</span>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.actionsContainer}>
          {!isLoggedIn ? (
            <Link
              href="/signin"
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${styles.applyButton}`}
            >
              Apply for a role
            </Link>
          ) : userRole === "candidate" ? (
            <Link
              href="/tutor"
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${styles.applyButton}`}
            >
              Go to Tutor Dashboard
            </Link>
          ) : userRole === "lecturer" ? (
            <Link
              href="/lecturer"
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${styles.applyButton}`}
            >
              Go to Lecturer Dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default React.memo(TimelineSection);
