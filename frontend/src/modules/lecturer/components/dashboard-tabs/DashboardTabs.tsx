import React from "react";
import styles from "./DashboardTabs.module.css";

type TabType = "applications" | "rankings" | "stats";

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className={styles.dashboardTabs}>
      <button
        className={`${styles.dashboardTabs__tabButton} ${activeTab === "applications" ? styles.dashboardTabs__tabButtonActive : ""}`}
        onClick={() => onTabChange("applications")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.dashboardTabs__tabIcon}
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
        Applications
      </button>
      <button
        className={`${styles.dashboardTabs__tabButton} ${activeTab === "rankings" ? styles.dashboardTabs__tabButtonActive : ""}`}
        onClick={() => onTabChange("rankings")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.dashboardTabs__tabIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        Rankings
      </button>
      <button
        className={`${styles.dashboardTabs__tabButton} ${activeTab === "stats" ? styles.dashboardTabs__tabButtonActive : ""}`}
        onClick={() => onTabChange("stats")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.dashboardTabs__tabIcon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Analytics
      </button>
    </div>
  );
};

export default DashboardTabs;
