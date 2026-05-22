import cors from "cors";

const parseAllowedOrigins = (): string[] => {
    const fromEnv = process.env.ALLOWED_ORIGINS;
    if (fromEnv) {
        return fromEnv.split(",").map((o) => o.trim()).filter(Boolean);
    }

    return [
        process.env.FRONTEND_URL || "http://localhost:3000",
        process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:3001",
    ];
};

export const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        const allowed = parseAllowedOrigins();
        if (allowed.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
};
