"use client";

import { useEffect } from "react";
import { retainPageBusy } from "@/shared/components/route-pending/loadingIndicator";
import styles from "./courses.module.css";

export default function CoursesSkeleton() {
  useEffect(() => retainPageBusy(), []);

  return (
    <div className={styles.page} aria-busy="true">
      <p className="sr-only">Loading…</p>
      <header className={styles.hero}>
        <div className={`${styles.skel} ${styles.skelMascot}`} />
        <div className={styles.searchColumn}>
          <div className={`${styles.skel} ${styles.skelBubble}`} />
          <div className={`${styles.skel} ${styles.skelSearch}`} />
          <div className={styles.skelHints}>
            <div className={`${styles.skel} ${styles.skelHint}`} />
            <div className={`${styles.skel} ${styles.skelHint}`} />
            <div className={`${styles.skel} ${styles.skelHintWide}`} />
          </div>
        </div>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.filters} aria-hidden="true">
          <div className={`${styles.skel} ${styles.skelFilterLabel}`} />
          <div className={`${styles.skel} ${styles.skelFilterRow}`} />
          <div className={`${styles.skel} ${styles.skelFilterRow}`} />
          <div className={`${styles.skel} ${styles.skelFilterRow}`} />
          <div className={`${styles.skel} ${styles.skelFilterLabel} ${styles.skelFilterGap}`} />
          <div className={`${styles.skel} ${styles.skelFilterRow}`} />
          <div className={`${styles.skel} ${styles.skelFilterRow}`} />
          <div className={`${styles.skel} ${styles.skelFilterRow}`} />
        </aside>
        <ul className={styles.list}>
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className={styles.card}>
              <div className={styles.face}>
                <div>
                  <div className={`${styles.skel} ${styles.skelCode}`} />
                  <div className={`${styles.skel} ${styles.skelName}`} />
                  <div className={`${styles.skel} ${styles.skelFact}`} />
                  <div className={`${styles.skel} ${styles.skelFact}`} />
                  <div className={`${styles.skel} ${styles.skelFactShort}`} />
                </div>
                <div className={styles.footer}>
                  <div className={`${styles.skel} ${styles.skelChip}`} />
                  <div className={`${styles.skel} ${styles.skelApply}`} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
