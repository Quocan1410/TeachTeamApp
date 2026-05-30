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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Compare applicants ({applications.length}/3)</h2>
          <button
            type="button"
            className={`${styles.closeBtn} iconCloseHit`}
            onClick={onClose}
            aria-label="Close compare panel"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.grid}>
          {applications.map((app) => {
            const name = formatCandidateDisplayName(
              app.candidate ?? { userType: "candidate" },
              "Candidate"
            );
            return (
              <div key={app.id} className={styles.col}>
                <h3>{name}</h3>
                <div className={styles.row}>
                  Status
                  <strong>{app.status}</strong>
                </div>
                <div className={styles.row}>
                  Course
                  <strong>{app.course.courseCode}</strong>
                </div>
                <div className={styles.row}>
                  Role
                  <strong>{app.role?.roleName}</strong>
                </div>
                <div className={styles.row}>
                  Availability
                  <strong>
                    {(app.availability as { type?: string })?.type ?? "—"}
                  </strong>
                </div>
                <div className={styles.row}>
                  Skills
                  <strong>{app.skills || "—"}</strong>
                </div>
                <div className={styles.row}>
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
