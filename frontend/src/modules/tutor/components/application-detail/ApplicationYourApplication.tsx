"use client";

import React, { useMemo } from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import metaStyles from "./applicationMeta.module.css";
import styles from "./ApplicationYourApplication.module.css";

interface ApplicationYourApplicationProps {
  application: ApplicationResponse;
  className?: string;
  /** Rows only — title/actions live in panel header. */
  contentOnly?: boolean;
  /** Inside scroll body below full hero. */
  inline?: boolean;
  /** Show availability (and section shell) even when other fields are empty. */
  showMinimum?: boolean;
}

const ApplicationYourApplication: React.FC<ApplicationYourApplicationProps> = ({
  application,
  className,
  contentOnly = false,
  inline = false,
  showMinimum = false,
}) => {
  const hasExtendedDetails = useMemo(
    () =>
      Boolean(application.motivation?.trim()) ||
      Boolean(application.experience?.trim()) ||
      Boolean(application.skills?.trim()),
    [application]
  );

  if (!showMinimum && !hasExtendedDetails) {
    return null;
  }

  const rows = (
    <div className={metaStyles.rows}>
      <div className={styles.topRow}>
        <p className={metaStyles.row}>
          <span className={metaStyles.label}>Availability</span>
          <span className={metaStyles.value}>
            {application.availability?.type ?? "—"}
          </span>
        </p>
        {application.skills?.trim() && (
          <p className={metaStyles.row}>
            <span className={metaStyles.label}>Skills</span>
            <span className={metaStyles.value}>
              {application.skills
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .join(", ")}
            </span>
          </p>
        )}
      </div>
      {application.motivation?.trim() && (
        <p className={metaStyles.row}>
          <span className={metaStyles.label}>Motivation</span>
          <span className={metaStyles.value}>{application.motivation}</span>
        </p>
      )}
      {application.experience?.trim() && (
        <p className={metaStyles.row}>
          <span className={metaStyles.label}>Experience</span>
          <span className={metaStyles.value}>{application.experience}</span>
        </p>
      )}
    </div>
  );

  if (contentOnly) {
    return (
      <div className={className} aria-labelledby="application-details-title">
        {rows}
      </div>
    );
  }

  const rootClass = inline ? styles.inline : styles.standalone;

  return (
    <section
      className={`${rootClass} ${className ?? ""}`}
      aria-labelledby="application-details-title"
    >
      <h3 className={styles.title} id="application-details-title">
        Your application
      </h3>
      {rows}
    </section>
  );
};

export default ApplicationYourApplication;
