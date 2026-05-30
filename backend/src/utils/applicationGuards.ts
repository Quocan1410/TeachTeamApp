import { Response } from "express";
import { Application } from "../entities/Application";

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
