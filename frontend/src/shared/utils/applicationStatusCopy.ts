import type { ApplicationStatus } from "@/shared/utils/applicationStatus";

export function getStatusExplanation(
  status: ApplicationStatus,
  isWithdrawn?: boolean
): string {
  if (isWithdrawn) {
    return "You withdrew this application. It is no longer under review.";
  }
  switch (status) {
    case "pending":
      return "Your application is in the review queue. The lecturer has not made a final decision yet.";
    case "selected":
      return "You have been selected for this role. Watch for onboarding instructions from the teaching team.";
    case "rejected":
      return "This application was not successful for the current intake. You may apply for other open roles.";
    default:
      return "";
  }
}

export function getStatusAccentClass(
  status: ApplicationStatus,
  isWithdrawn?: boolean
): string {
  if (isWithdrawn) return "accentWithdrawn";
  switch (status) {
    case "pending":
      return "accentPending";
    case "selected":
      return "accentSelected";
    case "rejected":
      return "accentRejected";
    default:
      return "accentPending";
  }
}
