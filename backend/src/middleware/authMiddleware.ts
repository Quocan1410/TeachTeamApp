import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

interface JwtPayload {
    userId: number;
    email: string;
    userType: string;
}

// Add interface for authenticated requests
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token is required",
        });
        return;
    }

    try {
        const jwtSecrets = [
            process.env.BACKEND_JWT_SECRET,
            process.env.JWT_SECRET,
            process.env.ADMIN_JWT_SECRET,
            "fallback_secret_key",
            "admin-secret-key",
        ].filter((value, index, array): value is string => {
            return !!value && array.indexOf(value) === index;
        });

        let decoded: JwtPayload | null = null;
        let lastError: unknown;

        for (const secret of jwtSecrets) {
            try {
                decoded = jwt.verify(token, secret) as JwtPayload;
                break;
            } catch (error) {
                lastError = error;
            }
        }

        if (!decoded) {
            throw lastError ?? new jwt.JsonWebTokenError("Invalid token");
        }

        // Verify user still exists in database and is not blocked
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
        });

        if (!user) {
            console.log(
                `Token verification failed: User ${decoded.userId} not found in database`
            );
            res.status(401).json({
                success: false,
                message: "User account not found",
            });
            return;
        }

        if (user.isBlocked) {
            console.log(
                `Token verification failed: User ${decoded.userId} is blocked`
            );
            res.status(403).json({
                success: false,
                message:
                    "Account has been blocked. Please contact administrator.",
            });
            return;
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: "Token has expired",
            });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({
                success: false,
                message: "Invalid token",
            });
        } else {
            console.error("Authentication error:", error);
            res.status(500).json({
                success: false,
                message: "Authentication verification failed",
            });
        }
        return;
    }
};

export const requireUserType = (allowedTypes: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }

        if (!allowedTypes.includes(req.user.userType)) {
            res.status(403).json({
                success: false,
                message: "Insufficient permissions",
            });
            return;
        }

        next();
    };
};
