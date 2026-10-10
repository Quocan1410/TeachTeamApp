"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import { formatCandidateDisplayName } from "@/shared/utils/personDisplayName";
import styles from "./ComparePanel.module.css";

interface ComparePanelProps {
  applications: ApplicationResponse[];
  onClose: () => void;
}

const ComparePanel: React.FC<ComparePanelProps> = ({ applications, onClose }) => {
  if (applications.length === 0) return null;

  return (
    <div className={styles.comparePanel__overlay} onClick={onClose}>
      <div className={styles.comparePanel__panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.comparePanel__header}>
          <h2>Compare applicants ({applications.length}/3)</h2>
          <button
            type="button"
            className={`${styles.comparePanel__closeBtn} iconClose__hit iconClose__circle`}
            onClick={onClose}
            aria-label="Close compare panel"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.comparePanel__grid}>
          {applications.map((app) => {
            const name = formatCandidateDisplayName(
              app.candidate ?? { userType: "candidate" },
              "Candidate"
            );
            return (
              <div key={app.id} className={styles.comparePanel__col}>
                <h3>{name}</h3>
                <div className={styles.comparePanel__row}>
                  Status
                  <strong>{app.status}</strong>
                </div>
                <div className={styles.comparePanel__row}>
                  Course
                  <strong>{app.course.courseCode}</strong>
                </div>
                <div className={styles.comparePanel__row}>
                  Role
                  <strong>{app.role?.roleName}</strong>
                </div>
                <div className={styles.comparePanel__row}>
                  Availability
                  <strong>
                    {(app.availability as { type?: string })?.type ?? "—"}
                  </strong>
                </div>
                <div className={styles.comparePanel__row}>
                  Skills
                  <strong>{app.skills || "—"}</strong>
                </div>
                <div className={styles.comparePanel__row}>
                  Experience
                  <strong>{app.experience || "—"}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComparePanel;
