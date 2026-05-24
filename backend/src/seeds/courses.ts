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
] as const;

export async function seedDefaultCourses(): Promise<void> {
    try {
        const courseRepository = AppDataSource.getRepository(Course);

        for (const courseData of DEFAULT_COURSES) {
            const existingCourse = await courseRepository.findOne({
                where: { courseCode: courseData.courseCode },
            });

            if (!existingCourse) {
                await courseRepository.save(
                    courseRepository.create(courseData)
                );
            }
        }
    } catch (error) {
        console.error("Error seeding default courses:", error);
    }
}
