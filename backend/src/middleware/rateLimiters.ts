import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 30 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});

export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 500 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    skip: (req) => req.path === "/health",
});
