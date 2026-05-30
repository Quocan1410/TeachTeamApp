import React from "react";
import styles from "@/shared/styles/applicationStatus.module.css";
import {
  getApplicationStatusClassName,
  getApplicationStatusLabel,
  type ApplicationStatus,
} from "@/shared/utils/applicationStatus";

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  isWithdrawn?: boolean;
}

function StatusIcon({ status }: { status: ApplicationStatus }) {
  if (status === "pending") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (status === "selected") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (status === "rejected") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return null;
}

const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  isWithdrawn = false,
}) => {
  const label = getApplicationStatusLabel(status, isWithdrawn);
  const className = getApplicationStatusClassName(status, isWithdrawn);

  return (
    <span className={className}>
      {!isWithdrawn && (
        <span className={styles.statusIcon}>
          <StatusIcon status={status} />
        </span>
      )}
      <span className={styles.statusText}>{label}</span>
    </span>
  );
};

export default ApplicationStatusBadge;
