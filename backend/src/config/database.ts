import { DataSource } from "typeorm";
import { config } from "dotenv";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification } from "../entities/Notification";
import { NotificationService } from "../services/NotificationService";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { Announcement } from "../entities/Announcement";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { RefreshToken } from "../entities/RefreshToken";
import { UserSecurityAnswer } from "../entities/UserSecurityAnswer";
import path from "path";
import { reconcileOrphanAvatarFiles } from "../utils/avatarUtils";

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, "../../../.env") });

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
    synchronize: process.env.DB_SYNC === "true",
    migrationsRun: process.env.NODE_ENV === "production",
    logging: process.env.NODE_ENV === "development",
    entities: [
        User,
        Course,
        Role,
        CourseAssignment,
        Application,
        SelectedCandidate,
        Notification,
        ApplicationDraft,
        Announcement,
        PasswordResetToken,
        RefreshToken,
        UserSecurityAnswer,
    ],
    migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
    subscribers: ["src/subscribers/*.ts"],
    // Connection options for Cloud MySQL
    extra: {
        charset: "utf8mb4_unicode_ci",
        connectTimeout: 60000,
    },
});

const isNotificationSchemaConflict = (error: unknown): boolean => {
    const err = error as { code?: string; driverError?: { code?: string } };
    return (
        err?.code === "ER_DROP_INDEX_FK" ||
        err?.driverError?.code === "ER_DROP_INDEX_FK"
    );
};

const recreateNotificationsTable = async (): Promise<void> => {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306", 10),
        user: process.env.DB_USERNAME || "",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "",
    });

    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query("DROP TABLE IF EXISTS notifications");
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.end();
};

const initializeDataSource = async (): Promise<void> => {
    await AppDataSource.initialize();
};

const ensureColumn = async (
    tableName: string,
    columnName: string,
    ddl: string
): Promise<void> => {
    const queryRunner = AppDataSource.createQueryRunner();
    try {
        const table = await queryRunner.getTable(tableName);
        const exists = table?.columns.some((c) => c.name === columnName);
        if (!exists) {
            await queryRunner.query(ddl);
        }
    } finally {
        await queryRunner.release();
    }
};

const ensureSchemaColumns = async (): Promise<void> => {
    if (process.env.DB_SYNC === "true") {
        await ensureColumn(
            "users",
            "avatarUrl",
            "ALTER TABLE `users` ADD `avatarUrl` varchar(512) NULL"
        );
        await ensureColumn(
            "users",
            "theme",
            "ALTER TABLE `users` ADD `theme` varchar(10) NOT NULL DEFAULT 'dark'"
        );
        await ensureColumn(
            "users",
            "honorific",
            "ALTER TABLE `users` ADD `honorific` varchar(10) NULL"
        );
        await ensureColumn(
            "courses",
            "applicationDeadline",
            "ALTER TABLE `courses` ADD `applicationDeadline` datetime NULL"
        );
        await ensureColumn(
            "applications",
            "lecturerNotes",
            "ALTER TABLE `applications` ADD `lecturerNotes` text NULL"
        );
        await ensureColumn(
            "applications",
            "correspondenceMessages",
            "ALTER TABLE `applications` ADD `correspondenceMessages` json NULL"
        );
        await ensureColumn(
            "applications",
            "offerResponse",
            "ALTER TABLE `applications` ADD `offerResponse` varchar(20) NULL"
        );
        await ensureColumn(
            "applications",
            "offerRespondedAt",
            "ALTER TABLE `applications` ADD `offerRespondedAt` datetime NULL"
        );
        await ensureColumn(
            "applications",
            "reviewedAt",
            "ALTER TABLE `applications` ADD `reviewedAt` datetime NULL"
        );
        await ensureColumn(
            "applications",
            "reviewedBy",
            "ALTER TABLE `applications` ADD `reviewedBy` int NULL"
        );
    }
};

export const initializeDatabase = async () => {
    try {
        await initializeDataSource();
        await ensureSchemaColumns();
        await syncNotificationsIfNeeded();
        await syncOrphanAvatarsIfNeeded();

        // Data is loaded via /api/database reset or manual bootstrap — not on every start.
    } catch (error) {
        throw error;
    }
};

const syncNotificationsIfNeeded = async (): Promise<void> => {
    const applicationCount = await AppDataSource.getRepository(Application).count();
    if (applicationCount === 0) {
        return;
    }

    await NotificationService.backfillFromApplications();
};

const syncOrphanAvatarsIfNeeded = async (): Promise<void> => {
    const linked = await reconcileOrphanAvatarFiles(
        AppDataSource.getRepository(User)
    );
    void linked;
};

export const initializeDatabaseConnection = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await initializeDataSource();
        }
    } catch (error) {
        throw error;
    }
};
