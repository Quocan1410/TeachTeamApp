import type { Application } from "../entities/Application";
import { getCorrespondenceMessages } from "./correspondenceMessages";

export const CORRESPONDENCE_INACTIVITY_MS = 5 * 24 * 60 * 60 * 1000;

export function getLastCorrespondenceActivityAt(
    application: Application
): Date {
    const messages = getCorrespondenceMessages(application);
    if (messages.length === 0) {
        return application.appliedAt ?? new Date();
    }
    return new Date(messages[messages.length - 1].createdAt);
}

export function isCorrespondenceInactive(application: Application): boolean {
    const last = getLastCorrespondenceActivityAt(application);
    return Date.now() - last.getTime() >= CORRESPONDENCE_INACTIVITY_MS;
}

export function canExchangeCorrespondence(application: Application): boolean {
    if (application.isWithdrawn) return false;
    if (application.candidate?.isBlocked) return false;
    return !isCorrespondenceInactive(application);
}
