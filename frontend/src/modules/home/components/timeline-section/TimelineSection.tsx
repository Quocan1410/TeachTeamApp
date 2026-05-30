import React from "react";
import styles from "./TimelineSection.module.css";
import Link from "next/link"; // Assuming the Apply button links somewhere
import Button from "@/shared/components/common/Button/Button"; // Import Button component

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
        <h2 className={styles.sectionHeading}>For Tutor Applicants</h2>
        <p className={styles.sectionSubheading}>
          Join our team of exceptional tutors and help shape the next generation
          of computer science professionals. Follow these simple steps to get
          started.
        </p>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineItem}>
            <div className={styles.timelineTitle}>Create Your Profile</div>
            <div className={styles.timelineDescription}>
              Showcase your skills, academic credentials, and previous teaching
              experience to stand out from other applicants.
            </div>
            <ul className={styles.timelineFeatures}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Academic qualifications visibility</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Skills showcase with verification</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Teaching experience highlights</span>
              </li>
            </ul>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineTitle}>Apply for Positions</div>
            <div className={styles.timelineDescription}>
              Browse available courses and apply for tutor and lab-assistant
              roles that match your expertise and availability.
            </div>
            <ul className={styles.timelineFeatures}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Course-specific applications</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Flexible scheduling options</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Tailored cover letters</span>
              </li>
            </ul>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineTitle}>Get Selected</div>
            <div className={styles.timelineDescription}>
              Lecturers review your profile and select candidates that best fit
              their course requirements.
            </div>
            <ul className={styles.timelineFeatures}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Real-time application status</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Direct communication with lecturers</span>
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                <span>Personalized feedback on applications</span>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.actionsContainer}>
          {!isLoggedIn ? (
            <Link href="/signin" passHref legacyBehavior>
              <Button variant="primary" className={styles.applyButton}>
                Apply as a Tutor
              </Button>
            </Link>
          ) : userRole === "candidate" ? (
            <Link href="/tutor" passHref legacyBehavior>
              <Button variant="primary" className={styles.applyButton}>
                Go to Tutor Dashboard
              </Button>
            </Link>
          ) : userRole === "lecturer" ? (
            <Link href="/lecturer" passHref legacyBehavior>
              <Button variant="primary" className={styles.applyButton}>
                Go to Lecturer Dashboard
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default React.memo(TimelineSection);
