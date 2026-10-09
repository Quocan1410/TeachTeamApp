"use client";

import { useEffect } from "react";
import { retainPageBusy } from "@/shared/components/route-pending/loadingIndicator";
import showcaseStyles from "@/modules/home/components/lecturer-showcase/LecturerShowcase.module.css";
import styles from "./lecturers.module.css";

export default function LecturersSkeleton() {
  useEffect(() => retainPageBusy(), []);

  return (
    <div className={styles.page} aria-busy="true">
      <p className="sr-only">Loading…</p>
      <header className={styles.stage}>
        <div className={styles.intro}>
          <div className={`${styles.skel} ${styles.skelTitle}`} />
          <div className={`${styles.skel} ${styles.skelLine}`} />
          <div className={`${styles.skel} ${styles.skelSearch}`} />
        </div>
        <div className={styles.portrait}>
          <div className={`${styles.skel} ${styles.skelSit}`} />
        </div>
      </header>
      <div className={showcaseStyles.directoryGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className={`${styles.skel} ${styles.skelCard}`} />
        ))}
      </div>
    </div>
  );
}
