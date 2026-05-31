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
  isCandidateBlocked?: boolean;
  isShortlisted?: boolean;
  isRanked?: boolean;
  isReviewed?: boolean;
}

function StatusIcon({
  status,
  isCandidateBlocked,
  isShortlisted,
  isRanked,
  isReviewed,
}: {
  status: ApplicationStatus;
  isCandidateBlocked?: boolean;
  isShortlisted?: boolean;
  isRanked?: boolean;
  isReviewed?: boolean;
}) {
  if (isCandidateBlocked) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (isRanked) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  if (isShortlisted) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (isReviewed) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path
          fillRule="evenodd"
          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
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
  isCandidateBlocked = false,
  isShortlisted = false,
  isRanked = false,
  isReviewed = false,
}) => {
  const label = getApplicationStatusLabel(
    status,
    isWithdrawn,
    isCandidateBlocked,
    isShortlisted,
    isRanked,
    isReviewed
  );
  const className = getApplicationStatusClassName(
    status,
    isWithdrawn,
    isCandidateBlocked,
    isShortlisted,
    isRanked,
    isReviewed
  );

  return (
    <span className={className}>
      {!isWithdrawn && (
        <span className={styles.statusIcon}>
          <StatusIcon
            status={status}
            isCandidateBlocked={isCandidateBlocked}
            isShortlisted={isShortlisted}
            isRanked={isRanked}
            isReviewed={isReviewed}
          />
        </span>
      )}
      <span className={styles.statusText}>{label}</span>
    </span>
  );
};

export default ApplicationStatusBadge;
