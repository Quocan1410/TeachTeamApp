import type { ApplicationResponse } from "@/shared/services/applicationService";

export const APPLICATION_UPDATED_EVENT = "application:updated";

export type ApplicationUpdateReason =
  | "created"
  | "candidate_response"
  | "offer_response"
  | "withdrawn"
  | "status"
  | "comment"
  | "comment_removed"
  | "rank"
  | "reaction"
  | "reviewed";

export type ApplicationUpdatedPayload = {
  reason: ApplicationUpdateReason;
  application: ApplicationResponse;
};
