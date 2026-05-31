import type { Application } from "../entities/Application";
import { getCorrespondenceMessages } from "./correspondenceMessages";

export function applicationHasLecturerReview(application: Application): boolean {
    if (application.reviewedAt) return true;
    if (application.comment?.trim()) return true;
    return getCorrespondenceMessages(application).some(
        (message) => message.authorRole === "lecturer"
    );
}

/** Record that a lecturer opened/reviewed the application (idempotent). */
export function touchApplicationReviewed(
    application: Application,
    lecturerId: number
): boolean {
    if (application.reviewedAt) {
        return false;
    }

    application.reviewedAt = new Date();
    application.reviewedBy = lecturerId;
    return true;
}
