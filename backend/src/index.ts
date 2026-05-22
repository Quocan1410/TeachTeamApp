import "reflect-metadata";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { initializeDatabase } from "./config/database";
import authRoutes from "./routes/user-auth-routes";
import applicationRoutes from "./routes/application-routes";
import databaseRoutes from "./routes/database-routes";
import notificationRoutes from "./routes/notification-routes";
import { getMelbourneTimestamp } from "./utils/dateUtils";
import path from "path";
import { ensureAvatarUploadDir } from "./utils/avatarUtils";

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, "../../.env") });

ensureAvatarUploadDir();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
const uploadsPath = path.resolve(__dirname, "../uploads");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsPath));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/notifications", notificationRoutes);

// Basic health check route
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Teaching Tutor Backend API is running",
        timestamp: getMelbourneTimestamp(),
        timezone: "Australia/Melbourne (AEST/AEDT)",
    });
});

// Database test route
app.get("/db-test", async (req, res) => {
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

// Manual database reset route
app.post("/db-reset", async (req, res) => {
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

// Start server
const startServer = async () => {
    try {
        // Initialize database connection (NO AUTO-RESET)
        await initializeDatabaseSafely();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
            console.log(
                `Avatar upload: POST http://localhost:${PORT}/api/auth/avatar`
            );
            console.log(
                `Application endpoints: http://localhost:${PORT}/api/applications`
            );
            console.log(
                `Database endpoints: http://localhost:${PORT}/api/database`
            );
            console.log(
                `Database status: http://localhost:${PORT}/api/database/status`
            );
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        console.warn("Starting server anyway for debugging purposes");

        app.listen(PORT, () => {
            console.log(
                `Server is running on port ${PORT} (DATABASE MAY NOT BE AVAILABLE)`
            );
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(
                `Manual database reset: POST http://localhost:${PORT}/api/database/reset`
            );
        });
    }
};

// Safe database initialization - NO AUTO-RESET, preserves existing data
const initializeDatabaseSafely = async () => {
    console.log("Starting Teaching Tutor Backend API...");
    console.log("Initializing database connection (safe mode)...");

    try {
        // Just initialize the database connection
        await initializeDatabase();
        console.log("Database initialization completed successfully");
        console.log("User data will be preserved across server restarts");
    } catch (error) {
        console.error("Database initialization failed:", error);
        console.warn("Manual database intervention may be required");

        // Don't auto-reset, just log the error
        console.log("To manually reset database if needed: POST /db-reset");
        throw error;
    }
};

startServer();
