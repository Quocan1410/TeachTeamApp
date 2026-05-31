import type { ApplicationResponse } from "@/shared/services/applicationService";
import { getCorrespondenceMessages } from "./correspondenceMessages";

export const CORRESPONDENCE_INACTIVITY_MS = 5 * 24 * 60 * 60 * 1000;

export function getLastCorrespondenceActivityAt(
  application: ApplicationResponse
): Date {
  const messages = getCorrespondenceMessages(application);
  if (messages.length === 0) {
    return new Date(application.appliedAt);
  }
  return new Date(messages[messages.length - 1].createdAt);
}

export function isCorrespondenceInactive(
  application: ApplicationResponse
): boolean {
  const last = getLastCorrespondenceActivityAt(application);
  return Date.now() - last.getTime() >= CORRESPONDENCE_INACTIVITY_MS;
}

export function canExchangeCorrespondence(
  application: ApplicationResponse
): boolean {
  if (application.isWithdrawn) return false;
  if (application.candidate?.isBlocked) return false;
  return !isCorrespondenceInactive(application);
}

export function candidateOfferPending(
  application: ApplicationResponse
): boolean {
  return (
    application.status === "selected" &&
    (!application.offerResponse || application.offerResponse === "pending")
  );
}

export function canCandidateSendCorrespondence(
  application: ApplicationResponse
): boolean {
  if (!canExchangeCorrespondence(application)) return false;
  if (candidateOfferPending(application)) return false;
  return true;
}

export function canLecturerSendCorrespondence(
  application: ApplicationResponse
): boolean {
  if (application.candidate?.isBlocked) return false;
  if (application.isWithdrawn) return false;
  return canExchangeCorrespondence(application);
}

export function getCorrespondenceClosedNotice(
  application: ApplicationResponse
): string | null {
  if (application.isWithdrawn || application.candidate?.isBlocked) {
    return null;
  }

  if (isCorrespondenceInactive(application)) {
    return "Chat closed after 5 days with no new messages.";
  }

  return null;
}
