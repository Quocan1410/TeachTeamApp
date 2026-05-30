import { Response, Request } from "express";
import { signBackendToken, AppJwtPayload } from "../config/jwtConfig";

export const AUTH_COOKIE_NAME = "teachteam_session";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, payload: AppJwtPayload): void {
    const token = signBackendToken(payload);
    res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE_MS,
        path: "/",
    });
}

export function clearAuthCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}

export function getAuthTokenFromRequest(req: Request): string | null {
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    if (typeof cookieToken === "string" && cookieToken.trim()) {
        return cookieToken.trim();
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }

    return null;
}
