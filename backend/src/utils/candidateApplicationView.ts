import type { Application } from "../entities/Application";

/** Strip lecturer-only workflow fields before returning applications to candidates. */
export function sanitizeApplicationForCandidate<T extends Application>(
    application: T
): T {
    const sanitized = { ...application } as T & {
        isShortlisted?: boolean;
    };

    delete sanitized.rank;
    delete sanitized.rankedBy;
    delete sanitized.rankedAt;
    delete sanitized.rankedForCourse;
    delete sanitized.rankedByUser;
    delete sanitized.lecturerNotes;
    delete sanitized.isShortlisted;

    return sanitized;
}

export function sanitizeApplicationsForCandidate<T extends Application>(
    applications: T[]
): T[] {
    return applications.map(sanitizeApplicationForCandidate);
}
