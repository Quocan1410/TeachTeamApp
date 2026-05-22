import jwt from "jsonwebtoken";

export interface AppJwtPayload {
    userId: number;
    email: string;
    userType: string;
}

const isProduction = (): boolean => process.env.NODE_ENV === "production";

export const getBackendJwtSecret = (): string => {
    const secret =
        process.env.BACKEND_JWT_SECRET || process.env.JWT_SECRET || "";

    if (!secret && isProduction()) {
        throw new Error("BACKEND_JWT_SECRET must be set in production");
    }

    return secret || "dev-only-backend-jwt-secret-change-me";
};

export const signBackendToken = (payload: AppJwtPayload): string => {
    return jwt.sign(payload, getBackendJwtSecret(), { expiresIn: "7d" });
};

export const getAdminJwtSecret = (): string => {
    const secret =
        process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "";

    if (!secret && isProduction()) {
        throw new Error("ADMIN_JWT_SECRET must be set in production");
    }

    return secret || "dev-only-admin-jwt-secret-change-me";
};

export const verifyBackendToken = (token: string): AppJwtPayload => {
    return jwt.verify(token, getBackendJwtSecret()) as AppJwtPayload;
};

/** Allow admin tokens on shared endpoints (e.g. avatar image). */
export const verifyAnyAppToken = (token: string): AppJwtPayload => {
    try {
        return verifyBackendToken(token);
    } catch {
        return jwt.verify(token, getAdminJwtSecret()) as AppJwtPayload;
    }
};
