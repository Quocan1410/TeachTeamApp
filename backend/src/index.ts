import "reflect-metadata";
import "./config/loadEnv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { initializeDatabase } from "./config/database";
import authRoutes from "./routes/user-auth-routes";
import applicationRoutes from "./routes/application-routes";
import applicationDraftRoutes from "./routes/application-draft-routes";
import announcementRoutes from "./routes/announcement-routes";
import notificationRoutes from "./routes/notification-routes";
import publicRoutes from "./routes/public-routes";
import cookieParser from "cookie-parser";
import { getAppTimestamp, getAppTimezoneLabel } from "./utils/appTime";
import path from "path";
import { ensureAvatarUploadDir } from "./utils/avatarUtils";
import { corsOptions } from "./config/corsConfig";
import { initSocketServer } from "./socket/socketServer";
import { generalRateLimiter } from "./middleware/rateLimiters";
import { startEmailScheduler } from "./jobs/emailScheduler";

ensureAvatarUploadDir();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5001;

app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(generalRateLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/application-drafts", applicationDraftRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);

app.get("/health", (_req, res) => {
    res.json({
        status: "OK",
        message: "Teaching Tutor Backend API is running",
        timestamp: getAppTimestamp(),
        timezone: getAppTimezoneLabel(),
    });
});

const startServer = async () => {
    console.log("Connecting to database ...");
    await initializeDatabase();
    startEmailScheduler();
    initSocketServer(httpServer);

    httpServer.listen(PORT);
    console.log(`Http Server is listening on port: ${PORT}`);
};

startServer();
