"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import styles from "./forgot-password.module.css";

type ResetLaterCardProps = {
  onBack: () => void;
};

export default function ResetLaterCard({ onBack }: ResetLaterCardProps) {
  return (
    <div className={styles.forgotPassword__laterPlain}>
      <div className={styles.forgotPassword__laterCard}>
        <div className={styles.forgotPassword__laterMark} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1 className={styles.forgotPassword__laterSorry}>Sorry</h1>
        <p className={styles.forgotPassword__laterText}>
          This feature will be implemented later.
          <span className={styles.forgotPassword__laterNote}>We know that&apos;s a little disappointing.</span>
        </p>
        <button type="button" className={styles.forgotPassword__laterQuiet} onClick={onBack}>
          <ArrowLeftIcon className={styles.forgotPassword__backArrow} aria-hidden="true" />
          Back
        </button>
      </div>
    </div>
  );
}
