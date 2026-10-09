import "reflect-metadata";
import "./config/loadEnv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import {
    initializeDatabase,
    pingDatabase,
    AppDataSource,
} from "./config/database";
import authRoutes from "./routes/user-auth-routes";
import applicationRoutes from "./routes/application-routes";
import applicationDraftRoutes from "./routes/application-draft-routes";
import notificationRoutes from "./routes/notification-routes";
import publicRoutes from "./routes/public-routes";
import cookieParser from "cookie-parser";
import { getAppTimestamp, getAppTimezoneLabel } from "./utils/appTime";
import { ensureAvatarUploadDir, UPLOADS_DIR } from "./utils/avatarUtils";
import { corsOptions } from "./config/corsConfig";
import { initSocketServer } from "./socket/socketServer";
import { generalRateLimiter } from "./middleware/rateLimiters";
ensureAvatarUploadDir();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(generalRateLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/application-drafts", applicationDraftRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);

app.get("/health", async (_req, res) => {
    const databaseConnected = await pingDatabase();
    const payload = {
        status: databaseConnected ? "OK" : "DEGRADED",
        message: "Teaching Tutor Backend API is running",
        database: databaseConnected ? "connected" : "disconnected",
        databaseInitialized: AppDataSource.isInitialized,
        timestamp: getAppTimestamp(),
        timezone: getAppTimezoneLabel(),
    };

    if (!databaseConnected) {
        res.status(503).json(payload);
        return;
    }

    res.json(payload);
});

let stopping = false;

const closeResources = async () => {
    if (httpServer.listening) {
        await new Promise<void>((resolve) => {
            httpServer.close(() => resolve());
        });
    }
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
};

const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`Stopping main API (${signal})`);
    void closeResources().finally(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const startServer = async () => {
    try {
        console.log(`Starting main API on port ${PORT}`);
        await initializeDatabase();
        if (stopping) {
            await closeResources();
            return;
        }
        initSocketServer(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Main API listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        await closeResources().catch(() => undefined);
        process.exit(1);
    }
};

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    process.exit(1);
});

startServer();
