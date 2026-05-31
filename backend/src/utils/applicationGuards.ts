import { Response } from "express";
import { Application } from "../entities/Application";
import { isCorrespondenceInactive } from "./correspondencePolicy";

export const WITHDRAWN_APPLICATION_MESSAGE =
    "This application was withdrawn and can no longer be modified.";

export const WITHDRAWN_REAPPLY_MESSAGE =
    "You withdrew this application. You cannot apply again for this role.";

export function respondIfWithdrawn(
    application: Application,
    res: Response
): boolean {
    if (application.isWithdrawn) {
        res.status(400).json({
            success: false,
            message: WITHDRAWN_APPLICATION_MESSAGE,
            code: "APPLICATION_WITHDRAWN",
        });
        return true;
    }
    return false;
}

export function respondIfCandidateBlocked(
    application: Application,
    res: Response
): boolean {
    if (application.candidate?.isBlocked) {
        res.status(400).json({
            success: false,
            message: "This candidate account is blocked — chat is unavailable.",
            code: "CANDIDATE_BLOCKED",
        });
        return true;
    }
    return false;
}

export const CORRESPONDENCE_INACTIVE_MESSAGE =
    "This chat closed after 5 days with no new messages.";

export function respondIfCorrespondenceInactive(
    application: Application,
    res: Response
): boolean {
    if (isCorrespondenceInactive(application)) {
        res.status(400).json({
            success: false,
            message: CORRESPONDENCE_INACTIVE_MESSAGE,
            code: "CORRESPONDENCE_INACTIVE",
        });
        return true;
    }
    return false;
}
