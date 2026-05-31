import type { ApplicationResponse } from "@/shared/services/applicationService";
import {
  applicationHasLecturerReview,
  getApplicationStatusLabel,
} from "@/shared/utils/applicationStatus";
import { getCorrespondenceMessages } from "@/shared/utils/correspondenceMessages";

export type ProcessNodeState =
  | "done"
  | "current"
  | "upcoming"
  | "bypassed";

export type ProcessNodeId =
  | "submitted"
  | "pending"
  | "reviewed"
  | "ranking"
  | "decision";

export interface ProcessNode {
  id: ProcessNodeId;
  label: string;
  state: ProcessNodeState;
}

export interface ApplicationProcessFlow {
  currentLabel: string;
  progressCaption: string;
  currentStepIndex: number;
  stepCount: number;
  steps: ProcessNode[];
}

function isTerminal(application: ApplicationResponse): boolean {
  return (
    Boolean(application.isWithdrawn) ||
    application.status === "selected" ||
    application.status === "rejected"
  );
}

function getDecisionLabel(application: ApplicationResponse): string {
  if (application.isWithdrawn) return "Withdrawn";
  if (application.status === "selected") return "Selected";
  if (application.status === "rejected") return "Not selected";
  return "Decision";
}

function hasLecturerChat(application: ApplicationResponse): boolean {
  if (application.comment?.trim()) return true;
  return getCorrespondenceMessages(application).some(
    (message) => message.authorRole === "lecturer"
  );
}

function connectorAfterStep(state: ProcessNodeState): boolean {
  return state === "done" || state === "bypassed";
}

export function buildApplicationProcessFlow(
  application: ApplicationResponse
): ApplicationProcessFlow {
  const hasReview = applicationHasLecturerReview(application);
  const terminal = isTerminal(application);

  let pending: ProcessNodeState = "upcoming";
  let reviewed: ProcessNodeState = "upcoming";
  let decision: ProcessNodeState = terminal ? "current" : "upcoming";

  if (application.isWithdrawn) {
    pending = "done";
    reviewed = hasReview ? "done" : "bypassed";
  } else if (terminal) {
    pending = "done";
    reviewed = hasReview ? "done" : "bypassed";
  } else if (application.status === "pending") {
    pending = hasReview ? "done" : "current";
    reviewed = hasReview ? "current" : "upcoming";
    decision = "upcoming";
  }

  const steps: ProcessNode[] = [
    { id: "submitted", label: "Submitted", state: "done" },
    { id: "pending", label: "Pending", state: pending },
    {
      id: "reviewed",
      label: "Reviewed",
      state: reviewed,
    },
    {
      id: "decision",
      label: getDecisionLabel(application),
      state: decision,
    },
  ];

  const currentIndex = steps.findIndex((s) => s.state === "current");
  const currentStepIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  let currentLabel = getApplicationStatusLabel(
    application.status,
    application.isWithdrawn
  );
  let progressCaption = "Tracking your application";

  if (application.isWithdrawn) {
    progressCaption = "You withdrew this application";
  } else if (application.status === "pending" && !hasReview) {
    currentLabel = "Pending";
    progressCaption = "In the lecturer review queue";
  } else if (hasReview && !terminal) {
    currentLabel = "Reviewed";
    if (hasLecturerChat(application)) {
      progressCaption = application.candidateResponse?.trim()
        ? "Application reviewed — you have replied"
        : "Your application was reviewed — reply in chat if needed";
    } else {
      progressCaption = "A lecturer has reviewed your application";
    }
  } else if (application.status === "selected") {
    progressCaption = "You were selected for this role";
  } else if (application.status === "rejected") {
    progressCaption = "Final outcome recorded for this intake";
  }

  return {
    currentLabel,
    progressCaption,
    currentStepIndex,
    stepCount: steps.length,
    steps,
  };
}

export function isConnectorAfterActive(state: ProcessNodeState): boolean {
  return connectorAfterStep(state);
}
