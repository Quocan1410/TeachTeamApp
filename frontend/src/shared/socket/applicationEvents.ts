import type { ApplicationResponse } from "@/shared/services/applicationService";

export const APPLICATION_UPDATED_EVENT = "application:updated";

export type ApplicationUpdateReason =
  | "created"
  | "candidate_response"
  | "withdrawn"
  | "status"
  | "comment"
  | "comment_removed"
  | "rank"
  | "reaction";

export type ApplicationUpdatedPayload = {
  reason: ApplicationUpdateReason;
  application: ApplicationResponse;
};
