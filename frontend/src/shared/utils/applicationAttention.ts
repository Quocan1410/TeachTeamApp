import type { ApplicationResponse } from "@/shared/services/applicationService";
import { canCandidateSendCorrespondence } from "@/shared/utils/applicationTimeline";

/** Lecturer left feedback and a new reply may be expected. */
export function applicationNeedsReply(
  application: ApplicationResponse
): boolean {
  if (!canCandidateSendCorrespondence(application)) return false;
  if (!application.comment?.trim()) return false;

  if (!application.candidateResponse?.trim()) return true;

  const respondedAt = application.candidateRespondedAt
    ? new Date(application.candidateRespondedAt).getTime()
    : 0;
  const commentAt = application.commentedAt
    ? new Date(application.commentedAt).getTime()
    : new Date(application.updatedAt).getTime();

  return respondedAt < commentAt;
}
