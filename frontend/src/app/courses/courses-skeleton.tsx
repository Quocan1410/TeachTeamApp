"use client";

import { useEffect } from "react";
import { retainPageBusy } from "@/shared/components/route-pending/loadingIndicator";
import styles from "./courses.module.css";

export default function CoursesSkeleton() {
  useEffect(() => retainPageBusy(), []);

  return (
    <div className={styles.courses__page} aria-busy="true">
      <p className="sr-only">Loading…</p>
      <header className={styles.courses__hero}>
        <div className={`${styles.courses__skel} ${styles.courses__skelMascot}`} />
        <div className={styles.courses__searchColumn}>
          <div className={`${styles.courses__skel} ${styles.courses__skelBubble}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelSearch}`} />
          <div className={styles.courses__skelHints}>
            <div className={`${styles.courses__skel} ${styles.courses__skelHint}`} />
            <div className={`${styles.courses__skel} ${styles.courses__skelHint}`} />
            <div className={`${styles.courses__skel} ${styles.courses__skelHintWide}`} />
          </div>
        </div>
      </header>
      <div className={styles.courses__workspace}>
        <aside className={styles.courses__filters} aria-hidden="true">
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterLabel}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterRow}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterRow}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterRow}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterLabel} ${styles.courses__skelFilterGap}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterRow}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterRow}`} />
          <div className={`${styles.courses__skel} ${styles.courses__skelFilterRow}`} />
        </aside>
        <ul className={styles.courses__list}>
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className={styles.courses__card}>
              <div className={styles.courses__face}>
                <div>
                  <div className={`${styles.courses__skel} ${styles.courses__skelCode}`} />
                  <div className={`${styles.courses__skel} ${styles.courses__skelName}`} />
                  <div className={`${styles.courses__skel} ${styles.courses__skelFact}`} />
                  <div className={`${styles.courses__skel} ${styles.courses__skelFact}`} />
                  <div className={`${styles.courses__skel} ${styles.courses__skelFactShort}`} />
                </div>
                <div className={styles.courses__footer}>
                  <div className={`${styles.courses__skel} ${styles.courses__skelChip}`} />
                  <div className={`${styles.courses__skel} ${styles.courses__skelApply}`} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
