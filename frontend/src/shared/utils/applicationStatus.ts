import statusStyles from "@/shared/styles/applicationStatus.module.css";
import { parseCorrespondenceMessages } from "@/shared/utils/correspondenceMessages";

export type ApplicationStatus = "pending" | "selected" | "rejected";

export interface ApplicationStatusDisplayOptions {
  isWithdrawn?: boolean;
  isCandidateBlocked?: boolean;
  isShortlisted?: boolean;
  isRanked?: boolean;
  isReviewed?: boolean;
}

export function applicationHasLecturerReview(application: {
  comment?: string | null;
  correspondenceMessages?: unknown;
  reviewedAt?: string | null;
}): boolean {
  if (application.reviewedAt) return true;
  if (application.comment?.trim()) return true;
  return parseCorrespondenceMessages(application.correspondenceMessages).some(
    (message) => message.authorRole === "lecturer"
  );
}

export function getApplicationStatusLabel(
  status: ApplicationStatus,
  isWithdrawn?: boolean,
  isCandidateBlocked?: boolean,
  isShortlisted?: boolean,
  isRanked?: boolean,
  isReviewed?: boolean
): string {
  if (isWithdrawn) return "Withdrawn";
  if (isCandidateBlocked) return "Blocked";
  if (status === "selected") return "Selected";
  if (status === "rejected") return "Not selected";
  if (isRanked) return "Ranked";
  if (isShortlisted) return "Shortlisted";
  if (isReviewed) return "Reviewed";
  return "Pending";
}

export function getApplicationStatusClassName(
  status: ApplicationStatus,
  isWithdrawn?: boolean,
  isCandidateBlocked?: boolean,
  isShortlisted?: boolean,
  isRanked?: boolean,
  isReviewed?: boolean
): string {
  const base = statusStyles.statusBadge;
  if (isWithdrawn) {
    return `${base} ${statusStyles["status-withdrawn"]}`;
  }
  if (isCandidateBlocked) {
    return `${base} ${statusStyles["status-blocked"]}`;
  }
  if (status === "selected") {
    return `${base} ${statusStyles["status-selected"]}`;
  }
  if (status === "rejected") {
    return `${base} ${statusStyles["status-rejected"]}`;
  }
  if (isRanked) {
    return `${base} ${statusStyles["status-ranked"]}`;
  }
  if (isShortlisted) {
    return `${base} ${statusStyles["status-shortlisted"]}`;
  }
  if (isReviewed) {
    return `${base} ${statusStyles["status-reviewed"]}`;
  }
  const variant =
    statusStyles[`status-${status}` as keyof typeof statusStyles] ??
    statusStyles["status-pending"];
  return `${base} ${variant}`;
}

export function resolveApplicationStatusDisplay(
  status: ApplicationStatus,
  application: {
    isWithdrawn?: boolean;
    isShortlisted?: boolean;
    rank?: number | null;
    candidate?: { isBlocked?: boolean } | null;
    comment?: string | null;
    correspondenceMessages?: unknown;
    reviewedAt?: string | null;
  },
  audience: "candidate" | "lecturer" = "lecturer"
): ApplicationStatusDisplayOptions & { status: ApplicationStatus } {
  const isCandidateBlocked = Boolean(application.candidate?.isBlocked);
  const showInternalStages = audience === "lecturer";
  const isRanked =
    showInternalStages &&
    !isCandidateBlocked &&
    status === "pending" &&
    application.rank != null &&
    application.rank > 0;
  const isShortlisted =
    showInternalStages &&
    !isCandidateBlocked &&
    !isRanked &&
    status === "pending" &&
    Boolean(application.isShortlisted);
  const isReviewed =
    !showInternalStages &&
    !isCandidateBlocked &&
    status === "pending" &&
    applicationHasLecturerReview(application);

  return {
    status,
    isWithdrawn: application.isWithdrawn,
    isCandidateBlocked: showInternalStages && isCandidateBlocked,
    isShortlisted,
    isRanked,
    isReviewed,
  };
}
