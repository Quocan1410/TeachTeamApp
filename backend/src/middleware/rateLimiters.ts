import "../config/loadEnv";
import rateLimit from "express-rate-limit";
import type { Request } from "express";

function isProductionRuntime(): boolean {
    return process.env.NODE_ENV === "production";
}

function getRequestPath(req: Request): string {
    const raw = req.originalUrl || req.url || req.path || "";
    return raw.split("?")[0];
}

/** Optional per-route limiter — not mounted globally (see index.ts). */
function isExemptFromGeneralRateLimit(req: Request): boolean {
    if (!isProductionRuntime()) {
        return true;
    }

    const path = getRequestPath(req);

    if (path === "/health") {
        return true;
    }

    if (path.startsWith("/api/auth")) {
        return true;
    }

    if (path.startsWith("/api/notifications")) {
        return true;
    }

    if (path.startsWith("/api/applications")) {
        return true;
    }

    if (path.startsWith("/api/application-drafts")) {
        return true;
    }

    if (path.startsWith("/api/announcements")) {
        return true;
    }

    return false;
}

/** Sign-in / sign-up only — mounted on those routes in user-auth-routes. */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: () => (isProductionRuntime() ? 30 : 500),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});

/** Available for optional route-specific use; not applied to every request. */
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: () => (isProductionRuntime() ? 500 : 10_000),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    skip: isExemptFromGeneralRateLimit,
});
