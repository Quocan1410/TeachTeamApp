import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { CourseAssignment } from "../entities/CourseAssignment";
const FEATURED_LECTURER_EMAILS = ["jane.morrison@lecturer.edu.au"];

export interface PublicLecturerCourse {
    courseCode: string;
    courseName: string;
    semester: string;
}

export interface PublicLecturerProfile {
    id: string;
    name: string;
    title: string;
    specialization: string;
    bio: string;
    courses: string;
    contact: string;
    assignedCourses: PublicLecturerCourse[];
}

export class PublicController {
    private userRepository = AppDataSource.getRepository(User);
    private courseAssignmentRepository =
        AppDataSource.getRepository(CourseAssignment);

    async getLecturers(_req: Request, res: Response): Promise<void> {
        try {
            const defaultEmails: string[] = FEATURED_LECTURER_EMAILS;

            const lecturers = await this.userRepository.find({
                where: {
                    userType: UserType.LECTURER,
                    isBlocked: false,
                },
                order: { lastName: "ASC", firstName: "ASC" },
            });

            lecturers.sort((a, b) => {
                const aDefault = defaultEmails.indexOf(a.email);
                const bDefault = defaultEmails.indexOf(b.email);
                if (aDefault !== -1 && bDefault !== -1) {
                    return aDefault - bDefault;
                }
                if (aDefault !== -1) return -1;
                if (bDefault !== -1) return 1;
                return a.lastName.localeCompare(b.lastName);
            });

            if (lecturers.length === 0) {
                res.json({
                    success: true,
                    data: { lecturers: [] as PublicLecturerProfile[] },
                });
                return;
            }

            const lecturerIds = lecturers.map((l) => l.id);
            const assignments = await this.courseAssignmentRepository.find({
                where: { lecturerId: In(lecturerIds) },
                relations: ["course"],
                order: { assignedAt: "ASC" },
            });

            const assignmentsByLecturer = new Map<number, PublicLecturerCourse[]>();
            for (const assignment of assignments) {
                if (!assignment.course) continue;
                const list = assignmentsByLecturer.get(assignment.lecturerId) ?? [];
                list.push({
                    courseCode: assignment.course.courseCode,
                    courseName: assignment.course.courseName,
                    semester: assignment.course.semester,
                });
                assignmentsByLecturer.set(assignment.lecturerId, list);
            }

            const profiles: PublicLecturerProfile[] = lecturers.map((lecturer) => {
                const assignedCourses =
                    assignmentsByLecturer.get(lecturer.id) ?? [];
                const courseLabels = assignedCourses.map(
                    (c) => `${c.courseCode} - ${c.courseName}`
                );
                const coursesText =
                    courseLabels.length > 0
                        ? courseLabels.join(", ")
                        : "Course assignments pending";

                const specialization =
                    assignedCourses.length > 0
                        ? assignedCourses
                              .map((c) => c.courseName)
                              .filter(
                                  (name, index, arr) => arr.indexOf(name) === index
                              )
                              .slice(0, 2)
                              .join(" · ")
                        : "Computer Science & Information Technology";

                const bio =
                    assignedCourses.length > 0
                        ? `${lecturer.firstName} ${lecturer.lastName} supports teaching teams for ${assignedCourses.map((c) => c.courseCode).join(", ")}. View assigned courses and semester details below.`
                        : `${lecturer.firstName} ${lecturer.lastName} is a lecturer on the TeachTeam platform. Course assignments will appear here once configured by an administrator.`;

                return {
                    id: String(lecturer.id),
                    name: `${lecturer.firstName} ${lecturer.lastName}`,
                    title: "Lecturer",
                    specialization,
                    bio,
                    courses: coursesText,
                    contact: lecturer.email,
                    assignedCourses,
                };
            });

            res.json({
                success: true,
                data: { lecturers: profiles },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to load lecturers",
            });
        }
    }
}
