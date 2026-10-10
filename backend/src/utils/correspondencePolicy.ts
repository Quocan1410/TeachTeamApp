import type { Application } from "../entities/Application";

export function canExchangeCorrespondence(application: Application): boolean {
    if (application.isWithdrawn) return false;
    if (application.candidate?.isBlocked) return false;
    return true;
}
