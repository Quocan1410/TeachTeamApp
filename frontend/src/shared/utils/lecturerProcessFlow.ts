import type { ApplicationResponse } from "@/shared/services/applicationService";
import type {
  ApplicationProcessFlow,
  ProcessNode,
  ProcessNodeState,
} from "@/shared/utils/applicationProcessFlow";

function isRanked(application: ApplicationResponse): boolean {
  return (
    application.rank !== null &&
    application.rank !== undefined &&
    application.rank > 0
  );
}

export function buildLecturerApplicationProcessFlow(
  application: ApplicationResponse
): ApplicationProcessFlow {
  const blocked = Boolean(application.candidate?.isBlocked);
  const shortlisted = Boolean(application.isShortlisted);
  const ranked = isRanked(application);
  const isSelected = application.status === "selected";
  const isRejected = application.status === "rejected";
  const terminal =
    blocked ||
    application.isWithdrawn ||
    isSelected ||
    isRejected;

  let screening: ProcessNodeState = "upcoming";
  let ranking: ProcessNodeState = "upcoming";
  let decision: ProcessNodeState = terminal ? "current" : "upcoming";

  if (blocked || application.isWithdrawn) {
    screening = "bypassed";
    ranking = "bypassed";
  } else if (isRejected) {
    screening = "done";
    ranking = "bypassed";
  } else if (isSelected) {
    screening = "done";
    ranking = ranked ? "done" : "bypassed";
  } else if (ranked) {
    screening = "done";
    ranking = "done";
    decision = "current";
  } else if (shortlisted) {
    screening = "done";
    ranking = "current";
    decision = "upcoming";
  } else if (application.status === "pending") {
    screening = "current";
    ranking = "upcoming";
    decision = "upcoming";
  }

  const decisionLabel = blocked
    ? "Blocked"
    : application.isWithdrawn
      ? "Withdrawn"
      : isSelected
        ? "Selected"
        : isRejected
          ? "Declined"
          : ranked
            ? "Final decision"
            : "Decision";

  const steps: ProcessNode[] = [
    { id: "submitted", label: "Submitted", state: "done" },
    { id: "pending", label: "Screening", state: screening },
    { id: "ranking", label: "Ranking", state: ranking },
    { id: "decision", label: decisionLabel, state: decision },
  ];

  const currentIndex = steps.findIndex((step) => step.state === "current");
  const currentStepIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  let progressCaption = "Review this application";
  if (blocked) {
    progressCaption = "Candidate account blocked by admin";
  } else if (application.isWithdrawn) {
    progressCaption = "Candidate withdrew this application";
  } else if (isRejected) {
    progressCaption = "Declined at screening";
  } else if (isSelected) {
    progressCaption = "Final selection recorded";
  } else if (ranked) {
    progressCaption = "Ready for final decision";
  } else if (shortlisted) {
    progressCaption = "Add to ranking after reviewing the profile";
  } else {
    progressCaption = "Shortlist or decline this profile";
  }

  return {
    currentLabel: decisionLabel,
    progressCaption,
    currentStepIndex,
    stepCount: steps.length,
    steps,
  };
}
