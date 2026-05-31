"use client";

import React from "react";
import { motion } from "framer-motion";
import styles from "./LecturerHeroSection.module.css";

interface LecturerHeroStat {
  value: number | string;
  label: string;
}

interface LecturerHeroSectionProps {
  title: string;
  highlight: string;
  subtitle: string;
  stats: LecturerHeroStat[];
}

const LecturerHeroSection: React.FC<LecturerHeroSectionProps> = ({
  title,
  highlight,
  subtitle,
  stats,
}) => {
  return (
    <motion.section
      className={styles.lecturerHeroSection}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        <div className={styles.lecturerHeroContent}>
          <motion.h1
            className={styles.lecturerHeroTitle}
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {title}{" "}
            <span className={styles.heroHighlight}>{highlight}</span>
          </motion.h1>
          <motion.p
            className={styles.lecturerHeroSubtitle}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {subtitle}
          </motion.p>

          <motion.div
            className={styles.lecturerStats}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
          >
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                {index > 0 && <div className={styles.statDivider} />}
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        <div className={styles.heroDecoration}>
          <div className={`${styles.circleDecoration} ${styles.circle1}`} />
          <div className={`${styles.circleDecoration} ${styles.circle2}`} />
          <div className={`${styles.circleDecoration} ${styles.circle3}`} />
        </div>
      </div>
    </motion.section>
  );
};

export default LecturerHeroSection;
