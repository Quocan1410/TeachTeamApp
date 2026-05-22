import { Request, Response, NextFunction } from "express";

/**
 * Protects dangerous dev/maintenance routes.
 * Requires NODE_ENV !== production OR x-dev-ops-key header matching DEV_OPS_SECRET.
 */
export const devOpsGuard = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (process.env.NODE_ENV !== "production") {
        next();
        return;
    }

    const provided = req.headers["x-dev-ops-key"];
    const expected = process.env.DEV_OPS_SECRET;

    if (expected && provided === expected) {
        next();
        return;
    }

    res.status(404).json({
        success: false,
        message: "Not found",
    });
};
