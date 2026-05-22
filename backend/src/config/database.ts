import { DataSource } from "typeorm";
import { config } from "dotenv";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application, ApplicationStatus } from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification } from "../entities/Notification";
import bcrypt from "bcryptjs";
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
    },
    connectTimeout: 60000,
    acquireTimeout: 60000,
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
            console.log("✅ Added avatarUrl column to users table");
        }
    } catch (error) {
        console.error("❌ Failed to ensure avatarUrl column:", error);
        throw error;
    } finally {
        await queryRunner.release();
    }
};

export const initializeDatabase = async () => {
    try {
        await initializeDataSource();
        await ensureAvatarUrlColumn();
        console.log("✅ Database connection initialized successfully");
        console.log("📊 All tables ready for TT application");

        // Seed default data
        await seedDefaultRoles();
        await seedDefaultCourses();
    } catch (error) {
        console.error("❌ Error during database initialization:", error);
        throw error;
    }
};

export const initializeDatabaseConnection = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await initializeDataSource();
            console.log("✅ Database connection initialized successfully");
            console.log("📊 All tables ready for TT application");
        }
    } catch (error) {
        console.error(
            "❌ Error during database connection initialization:",
            error
        );
        throw error;
    }
};

const seedDefaultRoles = async () => {
    try {
        const roleRepository = AppDataSource.getRepository(Role);

        const tutorRole = await roleRepository.findOne({
            where: { roleName: "tutor" },
        });
        if (!tutorRole) {
            const tutor = roleRepository.create({
                roleName: "tutor",
                description: "Tutor role for conducting tutorial sessions",
            });
            await roleRepository.save(tutor);
            console.log("✅ Tutor role created");
        }

        const labAssistantRole = await roleRepository.findOne({
            where: { roleName: "lab_assistant" },
        });
        if (!labAssistantRole) {
            const labAssistant = roleRepository.create({
                roleName: "lab_assistant",
                description:
                    "Lab Assistant role for assisting in laboratory sessions",
            });
            await roleRepository.save(labAssistant);
            console.log("✅ Lab Assistant role created");
        }
    } catch (error) {
        console.error("❌ Error seeding default roles:", error);
    }
};

const seedDefaultCourses = async () => {
    try {
        const courseRepository = AppDataSource.getRepository(Course);

        const defaultCourses = [
            {
                courseCode: "COSC2758",
                courseName: "Full Stack Development",
                semester: "Semester 1 2025",
                description:
                    "Learn to build modern web applications with React, Node.js, and databases",
                maxTutors: 5,
                maxLabAssistants: 3,
            },
            {
                courseCode: "COSC2938",
                courseName: "Further Web Programming",
                semester: "Semester 1 2025",
                description: "Advanced web development concepts and frameworks",
                maxTutors: 4,
                maxLabAssistants: 2,
            },
            {
                courseCode: "COSC1295",
                courseName: "Advanced Programming",
                semester: "Semester 1 2025",
                description: "Object-oriented programming with Java",
                maxTutors: 6,
                maxLabAssistants: 4,
            },
            {
                courseCode: "COSC2123",
                courseName: "Algorithms and Analysis",
                semester: "Semester 1 2025",
                description:
                    "Study of algorithms, data structures, and computational complexity",
                maxTutors: 4,
                maxLabAssistants: 3,
            },
            {
                courseCode: "COSC2767",
                courseName: "Systems Deployment and Operations",
                semester: "Semester 1 2025",
                description:
                    "Cloud deployment, DevOps practices, and system operations",
                maxTutors: 3,
                maxLabAssistants: 2,
            },
            {
                courseCode: "COSC2671",
                courseName: "Introduction to Web Programming",
                semester: "Semester 1 2025",
                description:
                    "Fundamentals of web development with HTML, CSS, and JavaScript",
                maxTutors: 5,
                maxLabAssistants: 4,
            },
        ];

        for (const courseData of defaultCourses) {
            const existingCourse = await courseRepository.findOne({
                where: { courseCode: courseData.courseCode },
            });

            if (!existingCourse) {
                const course = courseRepository.create(courseData);
                await courseRepository.save(course);
                console.log(`✅ Course ${courseData.courseCode} created`);
            }
        }
    } catch (error) {
        console.error("❌ Error seeding default courses:", error);
    }
};
