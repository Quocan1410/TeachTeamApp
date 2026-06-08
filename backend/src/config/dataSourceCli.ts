import "reflect-metadata";
import { config } from "dotenv";
import path from "path";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification } from "../entities/Notification";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { Announcement } from "../entities/Announcement";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { RefreshToken } from "../entities/RefreshToken";
import { UserSecurityAnswer } from "../entities/UserSecurityAnswer";

config({ path: path.resolve(__dirname, "../../../.env") });

/** CLI datasource — never auto-sync; use migration:run / db:reset instead. */
export default new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
    synchronize: false,
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
    extra: {
        charset: "utf8mb4_unicode_ci",
        connectTimeout: 60000,
    },
});
