"use client";

import { useEffect } from "react";
import { retainPageBusy } from "@/shared/components/route-pending/loadingIndicator";
import showcaseStyles from "@/modules/home/components/lecturer-showcase/LecturerShowcase.module.css";
import styles from "./lecturers.module.css";

export default function LecturersSkeleton() {
  useEffect(() => retainPageBusy(), []);

  return (
    <div className={styles.lecturers__page} aria-busy="true">
      <p className="sr-only">Loading…</p>
      <header className={styles.lecturers__stage}>
        <div className={styles.lecturers__intro}>
          <div className={`${styles.lecturers__skel} ${styles.lecturers__skelTitle}`} />
          <div className={`${styles.lecturers__skel} ${styles.lecturers__skelLine}`} />
          <div className={`${styles.lecturers__skel} ${styles.lecturers__skelSearch}`} />
        </div>
        <div className={styles.lecturers__portrait}>
          <div className={`${styles.lecturers__skel} ${styles.lecturers__skelSit}`} />
        </div>
      </header>
      <div className={showcaseStyles.lecturerShowcase__directoryGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className={`${styles.lecturers__skel} ${styles.lecturers__skelCard}`} />
        ))}
      </div>
    </div>
  );
}
