import { DataSource } from "typeorm";
import { config } from "dotenv";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification } from "../entities/Notification";
import path from "path";

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, "../../../.env") });

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
    synchronize: true, // Auto-create tables in development
    logging: process.env.NODE_ENV === "development",
    entities: [
        User,
        Course,
        Role,
        CourseAssignment,
        Application,
        SelectedCandidate,
        Notification,
    ],
    migrations: ["src/migrations/*.ts"],
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
    try {
        await AppDataSource.initialize();
    } catch (error) {
        if (!isNotificationSchemaConflict(error)) {
            throw error;
        }

        console.warn(
            "⚠️ Recreating notifications table (schema index conflict)..."
        );

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }

        await recreateNotificationsTable();
        await AppDataSource.initialize();
    }
};

const ensureAvatarUrlColumn = async (): Promise<void> => {
    const queryRunner = AppDataSource.createQueryRunner();
    try {
        const table = await queryRunner.getTable("users");
        const hasAvatarUrl = table?.columns.some(
            (column) => column.name === "avatarUrl"
        );

        if (!hasAvatarUrl) {
            await queryRunner.query(
                "ALTER TABLE `users` ADD `avatarUrl` varchar(512) NULL"
            );
        }
    } catch (error) {
        console.error("Failed to ensure avatarUrl column:", error);
        throw error;
    } finally {
        await queryRunner.release();
    }
};

export const initializeDatabase = async () => {
    try {
        await initializeDataSource();
        await ensureAvatarUrlColumn();

        const { runAllSeeds } = await import("../seeds");
        await runAllSeeds();
    } catch (error) {
        console.error("Error during database initialization:", error);
        throw error;
    }
};

export const initializeDatabaseConnection = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await initializeDataSource();
        }
    } catch (error) {
        console.error("Error during database connection initialization:", error);
        throw error;
    }
};
