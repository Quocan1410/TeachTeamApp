import { AppDataSource, initializeDatabaseConnection } from "../config/database";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification } from "../entities/Notification";

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
            console.error("Error checking database state:", error);
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
            console.error("Database connection failed:", error);
            return false;
        }
    }

    /**
     * Drop and recreate database schema completely
     */
    static async dropAndRecreateSchema(): Promise<void> {
        try {
            // Drop all tables to avoid constraint issues
            await AppDataSource.dropDatabase();

            // Recreate schema
            await AppDataSource.synchronize(true);

        } catch (error) {
            console.error("Error dropping/recreating schema:", error);
            throw error;
        }
    }

    /**
     * Clear all data from database tables (in correct order to handle foreign keys)
     */
    static async clearAllData(): Promise<void> {
        try {
            // Clear in reverse dependency order to avoid foreign key constraint errors
            await AppDataSource.getRepository(Notification).clear();
            await AppDataSource.getRepository(SelectedCandidate).clear();
            await AppDataSource.getRepository(Application).clear();
            await AppDataSource.getRepository(CourseAssignment).clear();
            await AppDataSource.getRepository(User).clear();
            await AppDataSource.getRepository(Course).clear();
            await AppDataSource.getRepository(Role).clear();
        } catch (error) {
            console.error("Error clearing database data:", error);
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

            // Seed essential data
            await this.seedEssentialData();

            // Verify the reset worked
            const isEmpty = await this.isDatabaseEmpty();
            if (isEmpty) {
                throw new Error("Database reset verification failed - database is still empty");
            }
        } catch (error) {
            console.error("Database reset failed:", error);
            throw error;
        }
    }

    /**
     * Seed essential data (extracted from database.ts to avoid re-initialization)
     */
    static async seedEssentialData(): Promise<void> {
        try {
            await this.seedDefaultRoles();
            await this.seedDefaultCourses();
            await this.seedMockLecturers();
            await this.seedCourseAssignments();
        } catch (error) {
            console.error("Error seeding essential data:", error);
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
            console.error("Auto-reset check failed:", error);
            // Try to reset anyway if we can't determine state
            try {
                await this.resetDatabase();
                return true;
            } catch (resetError) {
                console.error("Auto-reset failed:", resetError);
                throw resetError;
            }
        }
    }

    // Seeding functions (copied from database.ts to avoid circular imports)
    private static async seedDefaultRoles(): Promise<void> {
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
                    description: "Lab Assistant role for assisting in laboratory sessions",
                });
                await roleRepository.save(labAssistant);
                console.log("✅ Lab Assistant role created");
            }
        } catch (error) {
            console.error("❌ Error seeding default roles:", error);
        }
    }

    private static async seedDefaultCourses(): Promise<void> {
        try {
            const courseRepository = AppDataSource.getRepository(Course);

            const defaultCourses = [
                {
                    courseCode: "COSC2758",
                    courseName: "Full Stack Development",
                    semester: "Semester 1 2025",
                    description: "Learn to build modern web applications with React, Node.js, and databases",
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
                    description: "Study of algorithms, data structures, and computational complexity",
                    maxTutors: 4,
                    maxLabAssistants: 3,
                },
                {
                    courseCode: "COSC2767",
                    courseName: "Systems Deployment and Operations",
                    semester: "Semester 1 2025",
                    description: "Cloud deployment, DevOps practices, and system operations",
                    maxTutors: 3,
                    maxLabAssistants: 2,
                },
                {
                    courseCode: "COSC2671",
                    courseName: "Introduction to Web Programming",
                    semester: "Semester 1 2025",
                    description: "Fundamentals of web development with HTML, CSS, and JavaScript",
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
    }

    private static async seedMockLecturers(): Promise<void> {
        try {
            const bcrypt = await import("bcryptjs");
            const userRepository = AppDataSource.getRepository(User);
            const { UserType } = await import("../entities/User");
            const saltRounds = 10;

            const mockLecturers = [
                {
                    email: "john.smith@lecturer.edu.au",
                    password: "lecturer123",
                    firstName: "John",
                    lastName: "Smith",
                },
                {
                    email: "sarah.johnson@lecturer.edu.au",
                    password: "lecturer123",
                    firstName: "Sarah",
                    lastName: "Johnson",
                },
                {
                    email: "michael.williams@lecturer.edu.au",
                    password: "lecturer123",
                    firstName: "Michael",
                    lastName: "Williams",
                },
                {
                    email: "emily.brown@lecturer.edu.au",
                    password: "lecturer123",
                    firstName: "Emily",
                    lastName: "Brown",
                },
                {
                    email: "david.davis@lecturer.edu.au",
                    password: "lecturer123",
                    firstName: "David",
                    lastName: "Davis",
                },
                {
                    email: "lisa.wilson@lecturer.edu.au",
                    password: "lecturer123",
                    firstName: "Lisa",
                    lastName: "Wilson",
                },
            ];

            for (const lecturerData of mockLecturers) {
                const existingLecturer = await userRepository.findOne({
                    where: { email: lecturerData.email },
                });

                if (!existingLecturer) {
                    const hashedPassword = await bcrypt.default.hash(lecturerData.password, saltRounds);

                    const lecturer = userRepository.create({
                        email: lecturerData.email,
                        password: hashedPassword,
                        firstName: lecturerData.firstName,
                        lastName: lecturerData.lastName,
                        userType: UserType.LECTURER,
                        isBlocked: false,
                    });

                    await userRepository.save(lecturer);
                    console.log(`✅ Lecturer ${lecturerData.firstName} ${lecturerData.lastName} created`);
                }
            }
        } catch (error) {
            console.error("❌ Error seeding mock lecturers:", error);
        }
    }

    private static async seedCourseAssignments(): Promise<void> {
        try {
            const userRepository = AppDataSource.getRepository(User);
            const courseRepository = AppDataSource.getRepository(Course);
            const assignmentRepository = AppDataSource.getRepository(CourseAssignment);
            const { UserType } = await import("../entities/User");

            // Get all lecturers and courses
            const lecturers = await userRepository.find({
                where: { userType: UserType.LECTURER },
            });
            const courses = await courseRepository.find();

            if (lecturers.length === 0 || courses.length === 0) {
                console.log("⚠️ No lecturers or courses found for assignment seeding");
                return;
            }

            // Define course assignments (lecturer email -> course codes)
            const assignments = {
                "john.smith@lecturer.edu.au": ["COSC2758", "COSC2671"],
                "sarah.johnson@lecturer.edu.au": ["COSC2938", "COSC2123"],
                "michael.williams@lecturer.edu.au": ["COSC1295", "COSC2767"],
                "emily.brown@lecturer.edu.au": ["COSC2758", "COSC2938"],
                "david.davis@lecturer.edu.au": ["COSC2123", "COSC2671"],
                "lisa.wilson@lecturer.edu.au": ["COSC2767", "COSC1295"],
            };

            for (const [lecturerEmail, courseCodes] of Object.entries(assignments)) {
                const lecturer = lecturers.find(l => l.email === lecturerEmail);
                if (!lecturer) continue;

                for (const courseCode of courseCodes) {
                    const course = courses.find(c => c.courseCode === courseCode);
                    if (!course) continue;

                    // Check if assignment already exists
                    const existingAssignment = await assignmentRepository.findOne({
                        where: {
                            lecturerId: lecturer.id,
                            courseId: course.id,
                        },
                    });

                    if (!existingAssignment) {
                        const assignment = assignmentRepository.create({
                            lecturerId: lecturer.id,
                            courseId: course.id,
                        });

                        await assignmentRepository.save(assignment);
                        console.log(`✅ Assigned ${lecturer.firstName} ${lecturer.lastName} to ${course.courseCode}`);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error seeding course assignments:", error);
        }
    }


} 