import { AppDataSource, initializeDatabaseConnection } from "../config/database";
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
import { UserSecurityAnswer } from "../entities/UserSecurityAnswer";
import { RefreshToken } from "../entities/RefreshToken";
import { runBootstrapSeed } from "../seeds";

export class DatabaseResetService {
    /**
     * Check if the database is empty or needs initialization
     */
    static async isDatabaseEmpty(): Promise<boolean> {
        try {
            // First ensure we have a database connection
            if (!AppDataSource.isInitialized) {
                await initializeDatabaseConnection();
            }

            const userRepository = AppDataSource.getRepository(User);
            const courseRepository = AppDataSource.getRepository(Course);
            const roleRepository = AppDataSource.getRepository(Role);

            const userCount = await userRepository.count();
            const courseCount = await courseRepository.count();
            const roleCount = await roleRepository.count();

            // Consider database empty if any essential data is missing
            const isEmpty = userCount === 0 || courseCount === 0 || roleCount === 0;

            return isEmpty;
        } catch (error) {
            return true; // Assume empty if error occurs
        }
    }

    /**
     * Check database connectivity
     */
    static async checkDatabaseConnection(): Promise<boolean> {
        try {
            if (!AppDataSource.isInitialized) {
                await initializeDatabaseConnection();
            }

            // Test connection with a simple query
            await AppDataSource.query("SELECT 1");
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Drop schema and recreate via TypeORM migrations.
     */
    static async dropAndRecreateSchema(): Promise<void> {
        try {
            await AppDataSource.dropDatabase();
            await AppDataSource.runMigrations();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Clear all data from database tables (in correct order to handle foreign keys)
     */
    static async clearAllData(): Promise<void> {
        try {
            // Clear in reverse dependency order to avoid foreign key constraint errors
            await AppDataSource.getRepository(RefreshToken).clear();
            await AppDataSource.getRepository(PasswordResetToken).clear();
            await AppDataSource.getRepository(UserSecurityAnswer).clear();
            await AppDataSource.getRepository(Notification).clear();
            await AppDataSource.getRepository(SelectedCandidate).clear();
            await AppDataSource.getRepository(ApplicationDraft).clear();
            await AppDataSource.getRepository(Application).clear();
            await AppDataSource.getRepository(CourseAssignment).clear();
            await AppDataSource.getRepository(Announcement).clear();
            await AppDataSource.getRepository(User).clear();
            await AppDataSource.getRepository(Course).clear();
            await AppDataSource.getRepository(Role).clear();
        } catch (error) {
            throw error;
        }
    }

    /**
 * Reset database by clearing all data and reinitializing
 */
    static async resetDatabase(): Promise<void> {
        try {
            // Ensure database connection
            if (!AppDataSource.isInitialized) {
                await initializeDatabaseConnection();
            }

            // Drop and recreate schema to avoid constraint issues
            await this.dropAndRecreateSchema();

            await this.seedEssentialData();

            // Verify the reset worked
            const isEmpty = await this.isDatabaseEmpty();
            if (isEmpty) {
                throw new Error("Database reset verification failed - database is still empty");
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Seed essential data (extracted from database.ts to avoid re-initialization)
     */
    static async seedEssentialData(): Promise<void> {
        try {
            await runBootstrapSeed();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Auto-reset database if it's empty or corrupted
     */
    static async autoResetIfNeeded(): Promise<boolean> {
        try {
            const isEmpty = await this.isDatabaseEmpty();

            if (isEmpty) {
                await this.resetDatabase();
                return true;
            }
            return false;
        } catch (error) {
            // Try to reset anyway if we can't determine state
            try {
                await this.resetDatabase();
                return true;
            } catch (resetError) {
                throw resetError;
            }
        }
    }

} 