import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { CourseAssignment } from "../entities/CourseAssignment";

/** Four default lecturers for homepage showcase and dev sign-in. */
export const DEFAULT_LECTURERS = [
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
] as const;

/** Course codes assigned to each default lecturer (homepage + lecturer dashboard). */
export const DEFAULT_LECTURER_ASSIGNMENTS: Record<string, string[]> = {
    "john.smith@lecturer.edu.au": ["COSC2758", "COSC2671"],
    "sarah.johnson@lecturer.edu.au": ["COSC2938", "COSC2123"],
    "michael.williams@lecturer.edu.au": ["COSC1295", "COSC2767"],
    "emily.brown@lecturer.edu.au": ["COSC2758", "COSC2938"],
};

const SALT_ROUNDS = 10;

export async function seedDefaultLecturers(): Promise<void> {
    try {
        const userRepository = AppDataSource.getRepository(User);

        for (const lecturerData of DEFAULT_LECTURERS) {
            const existingLecturer = await userRepository.findOne({
                where: { email: lecturerData.email },
            });

            if (!existingLecturer) {
                const hashedPassword = await bcrypt.hash(
                    lecturerData.password,
                    SALT_ROUNDS
                );

                const lecturer = userRepository.create({
                    email: lecturerData.email,
                    password: hashedPassword,
                    firstName: lecturerData.firstName,
                    lastName: lecturerData.lastName,
                    userType: UserType.LECTURER,
                    isBlocked: false,
                });

                await userRepository.save(lecturer);
            }
        }
    } catch (error) {
        console.error("Error seeding default lecturers:", error);
    }
}

export async function seedDefaultLecturerAssignments(): Promise<void> {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const courseRepository = AppDataSource.getRepository(Course);
        const assignmentRepository =
            AppDataSource.getRepository(CourseAssignment);

        const lecturers = await userRepository.find({
            where: { userType: UserType.LECTURER },
        });
        const courses = await courseRepository.find();

        if (lecturers.length === 0 || courses.length === 0) {
            return;
        }

        for (const [lecturerEmail, courseCodes] of Object.entries(
            DEFAULT_LECTURER_ASSIGNMENTS
        )) {
            const lecturer = lecturers.find((l) => l.email === lecturerEmail);
            if (!lecturer) continue;

            for (const courseCode of courseCodes) {
                const course = courses.find(
                    (c) => c.courseCode === courseCode
                );
                if (!course) continue;

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
                }
            }
        }
    } catch (error) {
        console.error("Error seeding default lecturer assignments:", error);
    }
}

/** Ensures 4 default lecturers and their course assignments exist. */
export async function seedDefaultLecturersAndAssignments(): Promise<void> {
    await seedDefaultLecturers();
    await seedDefaultLecturerAssignments();
}
