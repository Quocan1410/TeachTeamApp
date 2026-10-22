import "./loadEnv";
import { DataSource } from "typeorm";
import { mysqlSslOption } from "./mysqlSsl";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification } from "../entities/Notification";
import { NotificationService } from "../services/NotificationService";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { RefreshToken } from "../entities/RefreshToken";
import { PasskeyCredential } from "../entities/PasskeyCredential";
import { PasskeyChallenge } from "../entities/PasskeyChallenge";
import { CourseSession } from "../entities/CourseSession";
import { CourseChangeRequest } from "../entities/CourseChangeRequest";
import path from "path";
import { reconcileOrphanAvatarFiles } from "../utils/avatarUtils";
import { mysqlPoolSize } from "./mysqlPool";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
    ssl: mysqlSslOption(),
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
        RefreshToken,
        PasskeyCredential,
        PasskeyChallenge,
        CourseSession,
        CourseChangeRequest,
    ],
    migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
    subscribers: ["src/subscribers/*.ts"],
    poolSize: mysqlPoolSize(),
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
        ssl: mysqlSslOption(),
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

const ensurePasskeyTables = async (): Promise<void> => {
    const queryRunner = AppDataSource.createQueryRunner();
    try {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`passkey_credentials\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`credentialId\` varchar(512) NOT NULL,
                \`publicKey\` text NOT NULL,
                \`counter\` int NOT NULL DEFAULT 0,
                \`transports\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_passkey_credential_id\` (\`credentialId\`),
                UNIQUE INDEX \`IDX_passkey_user\` (\`userId\`),
                CONSTRAINT \`FK_passkey_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`passkey_challenges\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NULL,
                \`challenge\` varchar(512) NOT NULL,
                \`purpose\` varchar(16) NOT NULL,
                \`expiresAt\` datetime NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_passkey_challenge\` (\`challenge\`)
            ) ENGINE=InnoDB
        `);
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
            "completedPageTours",
            "ALTER TABLE `users` ADD `completedPageTours` json NULL"
        );
        await ensureColumn(
            "users",
            "honorific",
            "ALTER TABLE `users` ADD `honorific` varchar(10) NULL"
        );
        await ensureColumn(
            "users",
            "description",
            "ALTER TABLE `users` ADD `description` text NULL"
        );
        await ensureColumn(
            "users",
            "skills",
            "ALTER TABLE `users` ADD `skills` text NULL"
        );
        await ensureColumn(
            "users",
            "website",
            "ALTER TABLE `users` ADD `website` varchar(255) NULL"
        );
        await ensureColumn(
            "courses",
            "applicationDeadline",
            "ALTER TABLE `courses` ADD `applicationDeadline` datetime NULL"
        );
        await ensureColumn(
            "courses",
            "coverImageUrl",
            "ALTER TABLE `courses` ADD `coverImageUrl` varchar(512) NULL"
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

const ensureProfileColumns = async (): Promise<void> => {
    await ensureColumn(
        "users",
        "description",
        "ALTER TABLE `users` ADD `description` text NULL"
    );
    await ensureColumn(
        "users",
        "skills",
        "ALTER TABLE `users` ADD `skills` text NULL"
    );
    await ensureColumn(
        "users",
        "website",
        "ALTER TABLE `users` ADD `website` varchar(255) NULL"
    );
    // Always ensure: ncc production bundle does not load glob migration files.
    await ensureColumn(
        "users",
        "completedPageTours",
        "ALTER TABLE `users` ADD `completedPageTours` json NULL"
    );
};

/** Always ensure: ncc does not ship TypeORM migration globs into dist/. */
const ensureCoursePublishingSchema = async (): Promise<void> => {
    await ensureColumn(
        "courses",
        "studentsPerClass",
        "ALTER TABLE `courses` ADD `studentsPerClass` int NOT NULL DEFAULT 15"
    );
    await ensureColumn(
        "courses",
        "isPublished",
        "ALTER TABLE `courses` ADD `isPublished` tinyint NOT NULL DEFAULT 0"
    );
    await ensureColumn(
        "courses",
        "coverImageUrl",
        "ALTER TABLE `courses` ADD `coverImageUrl` varchar(512) NULL"
    );

    const queryRunner = AppDataSource.createQueryRunner();
    try {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`course_sessions\` (
                \`id\` varchar(36) NOT NULL,
                \`courseId\` varchar(36) NOT NULL,
                \`sessionType\` varchar(20) NOT NULL,
                \`dayOfWeek\` tinyint NOT NULL,
                \`startTime\` varchar(8) NOT NULL,
                \`endTime\` varchar(8) NOT NULL,
                \`location\` varchar(120) NULL,
                \`capacity\` int NULL,
                \`sortOrder\` int NOT NULL DEFAULT 0,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_course_sessions_course_day_start\` (\`courseId\`, \`dayOfWeek\`, \`startTime\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_course_sessions_course\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`course_change_requests\` (
                \`id\` varchar(36) NOT NULL,
                \`courseId\` varchar(36) NOT NULL,
                \`requestedById\` varchar(36) NOT NULL,
                \`requestType\` varchar(20) NOT NULL,
                \`payload\` json NOT NULL,
                \`status\` varchar(20) NOT NULL DEFAULT 'pending',
                \`adminNote\` text NULL,
                \`resolvedById\` varchar(36) NULL,
                \`resolvedAt\` datetime NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_course_change_requests_course_status\` (\`courseId\`, \`status\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_course_change_requests_course\` FOREIGN KEY (\`courseId\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_course_change_requests_requester\` FOREIGN KEY (\`requestedById\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
    } finally {
        await queryRunner.release();
    }
};

export const initializeDatabase = async () => {
    try {
        console.log(
            `Connecting to MySQL ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${process.env.DB_NAME || ""}`
        );
        await initializeDataSource();
        console.log("MySQL connected");
        await ensureSchemaColumns();
        await ensureProfileColumns();
        await ensureCoursePublishingSchema();
        await ensurePasskeyTables();
        await syncNotificationsIfNeeded();
        await syncOrphanAvatarsIfNeeded();

        // Data is loaded via /api/database reset or manual bootstrap — not on every start.
    } catch (error) {
        console.error("Database initialization failed:", error);
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
            console.log("Opening MySQL connection...");
            await initializeDataSource();
        }
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};

export async function pingDatabase(): Promise<boolean> {
    try {
        if (!AppDataSource.isInitialized) {
            return false;
        }
        await AppDataSource.query("SELECT 1");
        return true;
    } catch (error) {
        console.error("Database ping failed:", error);
        return false;
    }
}
