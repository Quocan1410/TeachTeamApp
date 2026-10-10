import React from "react";
import { motion } from "framer-motion";
import styles from "./ApplicationsHeroSection.module.css";

interface ApplicationsHeroSectionProps {
  total: number;
  inReview: number;
  selected: number;
  closed: number;
}

const ApplicationsHeroSection: React.FC<ApplicationsHeroSectionProps> = ({
  total,
  inReview,
  selected,
  closed,
}) => {
  return (
    <motion.section
      className={styles.applicationsHeroSection__heroSection}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-label="Applications overview"
    >
      <div className={styles.applicationsHeroSection__heroDecoration} aria-hidden>
        <div className={`${styles.applicationsHeroSection__circle} ${styles.applicationsHeroSection__circle1}`} />
        <div className={`${styles.applicationsHeroSection__circle} ${styles.applicationsHeroSection__circle2}`} />
      </div>
      <div className="container">
        <div className={styles.applicationsHeroSection__heroContent}>
          <motion.h1
            className={styles.applicationsHeroSection__heroTitle}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            Track Every{" "}
            <span className={styles.applicationsHeroSection__heroHighlight}>Submission</span>
          </motion.h1>

          <motion.p
            className={styles.applicationsHeroSection__heroSubtitle}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            See status updates, reply when lecturers need more details, and
            withdraw applications anytime.
          </motion.p>

          <motion.ul
            className={styles.applicationsHeroSection__quickTips}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            aria-label="What you can do here"
          >
            <li>Status &amp; review</li>
            <li>Send updates</li>
            <li>Withdraw safely</li>
          </motion.ul>

          <motion.div
            className={styles.applicationsHeroSection__stats}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            role="group"
            aria-label="Application summary"
          >
            <div className={styles.applicationsHeroSection__statItem}>
              <div className={styles.applicationsHeroSection__statValue}>{total}</div>
              <div className={styles.applicationsHeroSection__statLabel}>Total</div>
            </div>
            <div className={styles.applicationsHeroSection__statDivider} aria-hidden />
            <div className={styles.applicationsHeroSection__statItem}>
              <div className={styles.applicationsHeroSection__statValue}>{inReview}</div>
              <div className={styles.applicationsHeroSection__statLabel}>In review</div>
            </div>
            <div className={styles.applicationsHeroSection__statDivider} aria-hidden />
            <div className={styles.applicationsHeroSection__statItem}>
              <div className={styles.applicationsHeroSection__statValue}>{selected}</div>
              <div className={styles.applicationsHeroSection__statLabel}>Selected</div>
            </div>
            <div className={styles.applicationsHeroSection__statDivider} aria-hidden />
            <div className={styles.applicationsHeroSection__statItem}>
              <div className={styles.applicationsHeroSection__statValue}>{closed}</div>
              <div className={styles.applicationsHeroSection__statLabel}>Closed</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ApplicationsHeroSection;
