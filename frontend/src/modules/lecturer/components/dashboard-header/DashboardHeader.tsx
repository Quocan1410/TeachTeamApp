import React from "react";
import styles from "./DashboardHeader.module.css";

interface Statistics {
  totalApplications: number;
  selectedTutorApplications: number;
  pendingTutorApplications: number;
  selectionRate: number;
}

interface DashboardHeaderProps {
  lecturerName: string;
  statistics: Statistics;
}

/** Quiet page header — same family as My Courses / Analytics. */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  lecturerName,
  statistics,
}) => {
  return (
    <header className={styles.dashboardHeader} data-tour="lecturer-header">
      <h1 className={styles.dashboardHeader__title}>Applicants</h1>
      <p className={styles.dashboardHeader__lead}>
        Welcome back, {lecturerName}. Review, shortlist, and rank candidates for
        your assigned courses.
      </p>

      <ul
        className={styles.dashboardHeader__metrics}
        aria-label="Application summary"
      >
        <li className={styles.dashboardHeader__metric}>
          <span className={styles.dashboardHeader__metricLabel}>Total</span>
          <strong className={styles.dashboardHeader__metricValue}>
            {statistics.totalApplications}
          </strong>
        </li>
        <li className={styles.dashboardHeader__metric}>
          <span className={styles.dashboardHeader__metricLabel}>Pending</span>
          <strong className={styles.dashboardHeader__metricValue}>
            {statistics.pendingTutorApplications}
          </strong>
        </li>
        <li className={styles.dashboardHeader__metric}>
          <span className={styles.dashboardHeader__metricLabel}>Selected</span>
          <strong className={styles.dashboardHeader__metricValue}>
            {statistics.selectedTutorApplications}
          </strong>
        </li>
        <li className={styles.dashboardHeader__metric}>
          <span className={styles.dashboardHeader__metricLabel}>
            Selection rate
          </span>
          <strong className={styles.dashboardHeader__metricValue}>
            {statistics.selectionRate}%
          </strong>
        </li>
      </ul>
    </header>
  );
};

export default DashboardHeader;
