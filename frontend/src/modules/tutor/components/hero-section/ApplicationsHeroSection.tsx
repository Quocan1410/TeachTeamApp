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
      className={styles.heroSection}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-label="Applications overview"
    >
      <div className={styles.heroDecoration} aria-hidden>
        <div className={`${styles.circle} ${styles.circle1}`} />
        <div className={`${styles.circle} ${styles.circle2}`} />
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <motion.h1
            className={styles.heroTitle}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            Track Every{" "}
            <span className={styles.heroHighlight}>Submission</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            See status updates, reply when lecturers need more details, and
            withdraw applications anytime.
          </motion.p>

          <motion.ul
            className={styles.quickTips}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            aria-label="What you can do here"
          >
            <li>Status &amp; feedback</li>
            <li>Send updates</li>
            <li>Withdraw safely</li>
          </motion.ul>

          <motion.div
            className={styles.stats}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            role="group"
            aria-label="Application summary"
          >
            <div className={styles.statItem}>
              <div className={styles.statValue}>{total}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
            <div className={styles.statDivider} aria-hidden />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{inReview}</div>
              <div className={styles.statLabel}>In review</div>
            </div>
            <div className={styles.statDivider} aria-hidden />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{selected}</div>
              <div className={styles.statLabel}>Selected</div>
            </div>
            <div className={styles.statDivider} aria-hidden />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{closed}</div>
              <div className={styles.statLabel}>Closed</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ApplicationsHeroSection;
