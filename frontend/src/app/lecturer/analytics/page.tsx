"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useLecturerAuth } from "@/modules/lecturer/hooks/useLecturerAuth";
import { useApplicationManagement } from "@/modules/lecturer/hooks/useApplicationManagement";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Application } from "@/shared/types/application";
import styles from "../LecturerPage.module.css";

const ApplicantStatsVisualization = dynamic(
  () =>
    import(
      "@/modules/lecturer/components/applicant-stats-visualization/applicant-stats-visualization"
    ),
  { ssr: false }
);

function LecturerAnalyticsInner() {
  const { isLoading: authLoading } = useAuth();
  useLecturerAuth();
  const { applications, isInitialized, isLoading } = useApplicationManagement();

  if (authLoading || !isInitialized || isLoading) {
    return <PageSkeleton variant="lecturer" />;
  }

  return (
    <div className={styles.lecturerPage__lecturerDashboard}>
      <div className="container">
        <header className={styles.lecturerPage__revealHeader}>
          <h1 className={styles.lecturerPage__pageHeading}>Analytics</h1>
          <p className={styles.lecturerPage__pageLead}>
            Charts for the applications on your assigned courses.
          </p>
        </header>
        <div className={styles.lecturerPage__statsSection}>
          <ApplicantStatsVisualization
            applications={applications as unknown as Application[]}
          />
        </div>
      </div>
    </div>
  );
}

export default function LecturerAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="lecturer" />}>
      <LecturerAnalyticsInner />
    </Suspense>
  );
}
