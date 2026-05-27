import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { config } from "dotenv";
import { initializeDatabase } from "./config/database";
import authRoutes from "./routes/user-auth-routes";
import applicationRoutes from "./routes/application-routes";
import applicationDraftRoutes from "./routes/application-draft-routes";
import announcementRoutes from "./routes/announcement-routes";
import databaseRoutes from "./routes/database-routes";
import notificationRoutes from "./routes/notification-routes";
import publicRoutes from "./routes/public-routes";
import { getMelbourneTimestamp } from "./utils/dateUtils";
import path from "path";
import { ensureAvatarUploadDir } from "./utils/avatarUtils";
import { corsOptions } from "./config/corsConfig";
import { devOpsGuard } from "./middleware/devOpsGuard";
import { generalRateLimiter } from "./middleware/rateLimiters";
import { initSocketServer } from "./socket/socketServer";

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, "../../.env") });

ensureAvatarUploadDir();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

app.use(helmet());
app.use(cors(corsOptions));
app.use(generalRateLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/application-drafts", applicationDraftRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);

app.get("/health", (_req, res) => {
    res.json({
        status: "OK",
        message: "Teaching Tutor Backend API is running",
        timestamp: getMelbourneTimestamp(),
        timezone: "Australia/Melbourne (AEST/AEDT)",
    });
});

app.get("/db-test", devOpsGuard, async (_req, res) => {
    try {
        const { DatabaseResetService } = await import("./utils/dbReset");

        const isConnected =
            await DatabaseResetService.checkDatabaseConnection();
        const isEmpty = await DatabaseResetService.isDatabaseEmpty();

        res.json({
            success: true,
            database: {
                connected: isConnected,
                isEmpty: isEmpty,
                status: isEmpty ? "EMPTY - needs data" : "HAS DATA",
            },
            timestamp: getMelbourneTimestamp(),
            timezone: "Australia/Melbourne (AEST/AEDT)",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: getMelbourneTimestamp(),
            timezone: "Australia/Melbourne (AEST/AEDT)",
        });
    }
});

app.post("/db-reset", devOpsGuard, async (_req, res) => {
    try {
        const { DatabaseResetService } = await import("./utils/dbReset");
        await DatabaseResetService.resetDatabase();

        res.json({
            success: true,
            message: "Database reset completed successfully",
            timestamp: getMelbourneTimestamp(),
            timezone: "Australia/Melbourne (AEST/AEDT)",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: getMelbourneTimestamp(),
            timezone: "Australia/Melbourne (AEST/AEDT)",
        });
    }
});

const startServer = async () => {
    try {
        await initializeDatabaseSafely();
        initSocketServer(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`WebSocket: ws://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
            console.log(
                `Avatar image: GET http://localhost:${PORT}/api/auth/avatar/image`
            );
            if (!isProduction) {
                console.log(
                    `Dev database reset: POST http://localhost:${PORT}/api/database/reset`
                );
            }
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        console.warn("Starting server anyway for debugging purposes");
        initSocketServer(httpServer);

        httpServer.listen(PORT, () => {
            console.log(
                `Server is running on port ${PORT} (DATABASE MAY NOT BE AVAILABLE)`
            );
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }
};

const initializeDatabaseSafely = async () => {
    console.log("Starting Teaching Tutor Backend API...");
    console.log("Initializing database connection (safe mode)...");

    try {
        await initializeDatabase();
        console.log("Database initialization completed successfully");
        console.log("User data will be preserved across server restarts");
    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
};

startServer();
