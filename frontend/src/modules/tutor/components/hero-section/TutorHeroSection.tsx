import React from "react";
import { motion } from "framer-motion";
import styles from "./TutorHeroSection.module.css";

interface TutorHeroSectionProps {
  availableCourses: number;
  userApplications: number;
  openPositions: number;
}

const TutorHeroSection: React.FC<TutorHeroSectionProps> = ({
  availableCourses,
  userApplications,
  openPositions,
}) => {
  return (
    <motion.div
      className={styles.tutorHeroSection}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        <div className={styles.tutorHeroContent}>
          <motion.h1
            className={styles.tutorHeroTitle}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Find Your Perfect{" "}
            <span className={styles.heroHighlight}>Teaching</span> Opportunity
          </motion.h1>
          <motion.p
            className={styles.tutorHeroSubtitle}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Browse available courses and apply for tutor or lab-assistant
            positions with the School of Computer Science
          </motion.p>

          {/* Stats */}
          <motion.div
            className={styles.tutorStats}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className={styles.statItem}>
              <div className={styles.statValue}>{availableCourses}</div>
              <div className={styles.statLabel}>Available Courses</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{userApplications}</div>
              <div className={styles.statLabel}>Your Applications</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{openPositions}</div>
              <div className={styles.statLabel}>Open Positions</div>
            </div>
          </motion.div>
        </div>

        <div className={styles.heroDecoration}>
          <div className={`${styles.circleDecoration} ${styles.circle1}`}></div>
          <div className={`${styles.circleDecoration} ${styles.circle2}`}></div>
          <div className={`${styles.circleDecoration} ${styles.circle3}`}></div>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorHeroSection;
