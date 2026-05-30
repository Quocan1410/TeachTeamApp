import { Router, Request, Response } from "express";
import { getAppTimestamp, getAppTimezoneLabel } from "../utils/appTime";
import { devOpsGuard } from "../middleware/devOpsGuard";

const router = Router();

router.use(devOpsGuard);

/**
 * GET /api/database/status
 * Check database status and connectivity
 */
router.get("/status", async (req: Request, res: Response) => {
    try {
        const { DatabaseResetService } = await import("../utils/dbReset");

        const isConnected = await DatabaseResetService.checkDatabaseConnection();
        const isEmpty = await DatabaseResetService.isDatabaseEmpty();

        res.json({
            success: true,
            status: {
                connected: isConnected,
                isEmpty: isEmpty,
                message: isEmpty
                    ? "Database is empty or missing essential data"
                    : "Database is properly initialized",
            },
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    } catch (error) {
        console.error("Error checking database status:", error);
        res.status(500).json({
            success: false,
            error: "Failed to check database status",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    }
});

/**
 * POST /api/database/reset
 * Manually trigger database reset
 */
router.post("/reset", async (req: Request, res: Response) => {
    try {
        const { DatabaseResetService } = await import("../utils/dbReset");
        await DatabaseResetService.resetDatabase();

        res.json({
            success: true,
            message: "Database reset completed successfully",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    } catch (error) {
        console.error("Database reset failed:", error);
        res.status(500).json({
            success: false,
            error: "Database reset failed",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    }
});

/**
 * POST /api/database/auto-reset
 * Auto-reset database only if empty or corrupted
 */
router.post("/auto-reset", async (req: Request, res: Response) => {
    try {
        const { DatabaseResetService } = await import("../utils/dbReset");
        const wasReset = await DatabaseResetService.autoResetIfNeeded();

        res.json({
            success: true,
            wasReset: wasReset,
            message: wasReset
                ? "Database was empty and has been reset with essential data"
                : "Database was already properly initialized, no reset needed",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    } catch (error) {
        console.error("Auto-reset check failed:", error);
        res.status(500).json({
            success: false,
            error: "Auto-reset check failed",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    }
});

/**
 * POST /api/database/seed
 * Seed essential data without clearing existing data
 */
router.post("/seed", async (req: Request, res: Response) => {
    try {
        const { DatabaseResetService } = await import("../utils/dbReset");
        await DatabaseResetService.seedEssentialData();

        res.json({
            success: true,
            message: "Essential data seeded successfully",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    } catch (error) {
        console.error("Seeding failed:", error);
        res.status(500).json({
            success: false,
            error: "Seeding failed",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: getAppTimestamp(),
            timezone: getAppTimezoneLabel(),
        });
    }
});

export default router;
