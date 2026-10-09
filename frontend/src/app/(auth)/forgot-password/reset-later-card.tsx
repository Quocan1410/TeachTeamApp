"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import styles from "./forgot-password.module.css";

type ResetLaterCardProps = {
  onBack: () => void;
};

export default function ResetLaterCard({ onBack }: ResetLaterCardProps) {
  return (
    <div className={styles.laterPlain}>
      <div className={styles.laterCard}>
        <div className={styles.laterMark} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1 className={styles.laterSorry}>Sorry</h1>
        <p className={styles.laterText}>
          This feature will be implemented later.
          <span className={styles.laterNote}>We know that&apos;s a little disappointing.</span>
        </p>
        <button type="button" className={styles.laterQuiet} onClick={onBack}>
          <ArrowLeftIcon className={styles.backArrow} aria-hidden="true" />
          Back
        </button>
      </div>
    </div>
  );
}
