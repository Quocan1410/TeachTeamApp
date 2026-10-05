import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application, ApplicationStatus } from "../entities/Application";
import { getCourseApplicationWindow } from "../utils/courseDeadline";
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
    private courseRepository = AppDataSource.getRepository(Course);
    private courseAssignmentRepository =
        AppDataSource.getRepository(CourseAssignment);
    private applicationRepository = AppDataSource.getRepository(Application);

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

            const assignmentsByLecturer = new Map<string, PublicLecturerCourse[]>();
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

    async getOpenings(_req: Request, res: Response): Promise<void> {
        try {
            const courses = await this.courseRepository.find({
                order: { courseCode: "ASC" },
            });
            const assignments = await this.courseAssignmentRepository.find({
                relations: ["lecturer"],
            });
            const selectedRows = await this.applicationRepository
                .createQueryBuilder("application")
                .innerJoin("application.role", "role")
                .select("application.courseId", "courseId")
                .addSelect("role.roleName", "roleName")
                .addSelect("COUNT(*)", "total")
                .where("application.status = :status", {
                    status: ApplicationStatus.SELECTED,
                })
                .andWhere("application.isWithdrawn = :isWithdrawn", {
                    isWithdrawn: false,
                })
                .groupBy("application.courseId")
                .addGroupBy("role.roleName")
                .getRawMany<{
                    courseId: string;
                    roleName: string;
                    total: string;
                }>();

            const selectedByCourse = new Map<string, number>();
            for (const row of selectedRows) {
                selectedByCourse.set(
                    `${row.courseId}:${row.roleName}`,
                    Number(row.total) || 0
                );
            }

            const lecturersByCourse = new Map<string, string[]>();
            for (const assignment of assignments) {
                if (!assignment.lecturer || assignment.lecturer.isBlocked) {
                    continue;
                }
                const name =
                    `${assignment.lecturer.firstName} ${assignment.lecturer.lastName}`.trim();
                const list = lecturersByCourse.get(assignment.courseId) ?? [];
                if (!list.includes(name)) list.push(name);
                lecturersByCourse.set(assignment.courseId, list);
            }

            const openings = courses.map((course) => {
                const window = getCourseApplicationWindow(course);
                const tutorPlacesLeft = Math.max(
                    0,
                    course.maxTutors -
                        (selectedByCourse.get(`${course.id}:tutor`) ?? 0)
                );
                const labAssistantPlacesLeft = Math.max(
                    0,
                    course.maxLabAssistants -
                        (selectedByCourse.get(`${course.id}:lab_assistant`) ??
                            0)
                );
                return {
                    courseId: course.id,
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    semester: course.semester,
                    applicationDeadline: window.applicationDeadline,
                    isApplicationOpen: window.isApplicationOpen,
                    tutorPlacesLeft,
                    labAssistantPlacesLeft,
                    lecturers: lecturersByCourse.get(course.id) ?? [],
                };
            });

            openings.sort((a, b) => {
                if (a.isApplicationOpen !== b.isApplicationOpen) {
                    return a.isApplicationOpen ? -1 : 1;
                }
                return a.courseCode.localeCompare(b.courseCode);
            });

            res.json({ success: true, data: { openings } });
        } catch {
            res.status(500).json({
                success: false,
                message: "Failed to load open roles",
            });
        }
    }
}
