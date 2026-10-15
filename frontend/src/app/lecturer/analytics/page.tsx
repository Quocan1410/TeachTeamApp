"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { useLecturerAuth } from "@/modules/lecturer/hooks/useLecturerAuth";
import { useApplicationManagement } from "@/modules/lecturer/hooks/useApplicationManagement";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import styles from "./LecturerAnalyticsPage.module.css";

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
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.lead}>
            A quiet read of applications across your assigned courses.
          </p>
        </header>
        <ApplicantStatsVisualization applications={applications} />
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
