import type { ApplicationResponse } from "@/shared/services/applicationService";
import { getApplicationStatusLabel } from "@/shared/utils/applicationStatus";

export type ProcessNodeState =
  | "done"
  | "current"
  | "upcoming"
  | "bypassed";

export type ProcessNodeId =
  | "submitted"
  | "pending"
  | "feedback"
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

function connectorAfterStep(state: ProcessNodeState): boolean {
  return state === "done" || state === "bypassed";
}

export function buildApplicationProcessFlow(
  application: ApplicationResponse
): ApplicationProcessFlow {
  const hasComment = Boolean(application.comment?.trim());
  const terminal = isTerminal(application);

  let pending: ProcessNodeState = "upcoming";
  let feedback: ProcessNodeState = "upcoming";
  let decision: ProcessNodeState = terminal ? "current" : "upcoming";

  if (application.isWithdrawn) {
    pending = "done";
    feedback = hasComment ? "done" : "bypassed";
  } else if (terminal) {
    pending = "done";
    feedback = hasComment ? "done" : "bypassed";
  } else if (application.status === "pending") {
    pending = hasComment ? "done" : "current";
    feedback = hasComment ? "current" : "upcoming";
    decision = "upcoming";
  }

  const steps: ProcessNode[] = [
    { id: "submitted", label: "Submitted", state: "done" },
    { id: "pending", label: "Pending", state: pending },
    {
      id: "feedback",
      label: "Feedback",
      state: feedback,
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
  } else if (application.status === "pending" && !hasComment) {
    currentLabel = "Pending";
    progressCaption = "In the lecturer review queue";
  } else if (hasComment && !terminal) {
    currentLabel = "Feedback";
    progressCaption = application.candidateResponse?.trim()
      ? "Lecturer feedback — you have replied"
      : "Read lecturer feedback and reply if needed";
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
