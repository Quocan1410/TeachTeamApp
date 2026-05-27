import { AppDataSource } from "../config/database";
import { Course } from "../entities/Course";

export const DEFAULT_COURSES = [
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
    {
        courseCode: "COSC2401",
        courseName: "Database Systems",
        semester: "Semester 2 2026",
        description:
            "Relational design, SQL, indexing, transactions, and data modelling",
        maxTutors: 4,
        maxLabAssistants: 3,
    },
    {
        courseCode: "COSC2510",
        courseName: "Computer Networks",
        semester: "Semester 2 2026",
        description:
            "TCP/IP, routing, network security, and protocol analysis labs",
        maxTutors: 3,
        maxLabAssistants: 4,
    },
    {
        courseCode: "COSC2810",
        courseName: "Software Engineering Process",
        semester: "Semester 2 2026",
        description:
            "Agile delivery, requirements, testing, CI/CD, and team project practices",
        maxTutors: 5,
        maxLabAssistants: 2,
    },
    {
        courseCode: "COSC2207",
        courseName: "Cyber Security Fundamentals",
        semester: "Semester 2 2026",
        description:
            "Threat modelling, cryptography basics, secure coding, and incident response",
        maxTutors: 4,
        maxLabAssistants: 3,
    },
    {
        courseCode: "COSC2625",
        courseName: "Mobile Application Development",
        semester: "Semester 2 2026",
        description:
            "Cross-platform mobile apps with React Native and native API integration",
        maxTutors: 4,
        maxLabAssistants: 3,
    },
] as const;

/**
 * Application deadline = today + N days (re-applied on every seed run).
 * Spread: urgent (3–7d) → mid (12–28d) → later (35–60d).
 */
const DEADLINE_DAYS: Record<string, number> = {
    COSC2671: 4,
    COSC2401: 7,
    COSC2758: 12,
    COSC2767: 16,
    COSC2625: 19,
    COSC2938: 24,
    COSC2510: 28,
    COSC1295: 35,
    COSC2810: 42,
    COSC2123: 50,
    COSC2207: 56,
};

const deadlineFromNow = (days: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
};

export async function seedDefaultCourses(): Promise<void> {
    try {
        const courseRepository = AppDataSource.getRepository(Course);

        for (const courseData of DEFAULT_COURSES) {
            const days =
                DEADLINE_DAYS[courseData.courseCode] ?? 60;
            const deadline = deadlineFromNow(days);

            const existingCourse = await courseRepository.findOne({
                where: { courseCode: courseData.courseCode },
            });

            if (!existingCourse) {
                await courseRepository.save(
                    courseRepository.create({
                        ...courseData,
                        applicationDeadline: deadline,
                    })
                );
            } else {
                existingCourse.applicationDeadline = deadline;
                await courseRepository.save(existingCourse);
            }
        }
    } catch (error) {
        console.error("Error seeding default courses:", error);
    }
}
