import type { ApplicationResponse } from "@/shared/services/applicationService";

export function canExchangeCorrespondence(
  application: ApplicationResponse
): boolean {
  if (application.isWithdrawn) return false;
  if (application.candidate?.isBlocked) return false;
  return true;
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

export function getCorrespondenceClosedNotice(): string | null {
  return null;
}
