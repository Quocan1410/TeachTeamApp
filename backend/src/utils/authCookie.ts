import { Response, Request } from "express";
import { signBackendToken, AppJwtPayload } from "../config/jwtConfig";

export const AUTH_COOKIE_NAME = "teachteam_session";
export const REFRESH_COOKIE_NAME = "teachteam_refresh";

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieBaseOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
});

export function setAuthCookie(res: Response, payload: AppJwtPayload): void {
    const token = signBackendToken(payload);
    res.cookie(AUTH_COOKIE_NAME, token, {
        ...cookieBaseOptions(),
        maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    });
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        ...cookieBaseOptions(),
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
}

export function clearAuthCookie(res: Response): void {
    const opts = cookieBaseOptions();
    res.clearCookie(AUTH_COOKIE_NAME, opts);
    res.clearCookie(REFRESH_COOKIE_NAME, opts);
}

export function getRefreshTokenFromRequest(req: Request): string | null {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (typeof cookieToken === "string" && cookieToken.trim()) {
        return cookieToken.trim();
    }
    return null;
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
