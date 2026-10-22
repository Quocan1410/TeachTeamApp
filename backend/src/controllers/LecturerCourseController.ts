import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Course } from "../entities/Course";
import { CourseAssignment } from "../entities/CourseAssignment";
import {
    CourseSession,
    CourseSessionType,
} from "../entities/CourseSession";
import {
    CourseChangeRequest,
    CourseChangeRequestType,
} from "../entities/CourseChangeRequest";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
    buildCourseCoverPublicPath,
    deleteCourseCoverFileIfExists,
} from "../utils/courseCoverUtils";

const DAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function normalizeTime(value: string): string {
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
    return trimmed;
}

function minutesOf(time: string): number {
    const [h, m] = normalizeTime(time).split(":").map(Number);
    return h * 60 + m;
}

function serializeSession(session: CourseSession) {
    return {
        id: session.id,
        courseId: session.courseId,
        sessionType: session.sessionType,
        dayOfWeek: session.dayOfWeek,
        dayLabel: DAY_LABELS[session.dayOfWeek] ?? String(session.dayOfWeek),
        startTime: session.startTime.slice(0, 5),
        endTime: session.endTime.slice(0, 5),
        location: session.location,
        capacity: session.capacity,
        sortOrder: session.sortOrder,
    };
}

function serializeCourse(
    course: Course,
    sessions: CourseSession[],
    pendingRequests: CourseChangeRequest[]
) {
    return {
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        semester: course.semester,
        description: course.description ?? "",
        coverImageUrl: course.coverImageUrl ?? null,
        maxTutors: course.maxTutors,
        maxLabAssistants: course.maxLabAssistants,
        studentsPerClass: course.studentsPerClass,
        isPublished: course.isPublished,
        applicationDeadline: course.applicationDeadline,
        sessions: sessions
            .slice()
            .sort(
                (a, b) =>
                    a.dayOfWeek - b.dayOfWeek ||
                    a.startTime.localeCompare(b.startTime) ||
                    a.sortOrder - b.sortOrder
            )
            .map(serializeSession),
        pendingRequests: pendingRequests.map((request) => ({
            id: request.id,
            requestType: request.requestType,
            status: request.status,
            payload: request.payload,
            createdAt: request.createdAt,
        })),
    };
}

export class LecturerCourseController {
    private courseRepository = AppDataSource.getRepository(Course);
    private assignmentRepository = AppDataSource.getRepository(CourseAssignment);
    private sessionRepository = AppDataSource.getRepository(CourseSession);
    private requestRepository = AppDataSource.getRepository(CourseChangeRequest);

    private async requireAssignedCourse(lecturerId: string, courseId: string) {
        const assignment = await this.assignmentRepository.findOne({
            where: { lecturerId, courseId },
            relations: ["course"],
        });
        if (!assignment?.course) return null;
        return assignment.course;
    }

    private validateSessionInput(body: {
        sessionType?: string;
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        location?: string | null;
        capacity?: number | null;
    }): { ok: true; data: {
        sessionType: CourseSessionType;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        location: string | null;
        capacity: number | null;
    } } | { ok: false; message: string } {
        const sessionType = body.sessionType as CourseSessionType;
        if (sessionType !== "lecture" && sessionType !== "tutorial") {
            return { ok: false, message: "sessionType must be lecture or tutorial" };
        }
        const dayOfWeek = Number(body.dayOfWeek);
        if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
            return { ok: false, message: "dayOfWeek must be 0–6" };
        }
        if (!body.startTime || !TIME_RE.test(body.startTime.trim())) {
            return { ok: false, message: "startTime must be HH:MM" };
        }
        if (!body.endTime || !TIME_RE.test(body.endTime.trim())) {
            return { ok: false, message: "endTime must be HH:MM" };
        }
        const startTime = normalizeTime(body.startTime);
        const endTime = normalizeTime(body.endTime);
        const duration = minutesOf(endTime) - minutesOf(startTime);
        if (duration <= 0) {
            return { ok: false, message: "endTime must be after startTime" };
        }
        if (sessionType === "lecture" && duration !== 120) {
            return {
                ok: false,
                message: "Lecture sessions must be exactly 2 hours",
            };
        }
        if (sessionType === "tutorial" && (duration < 60 || duration > 180)) {
            return {
                ok: false,
                message: "Tutorial sessions should be 1–3 hours",
            };
        }
        const capacity =
            body.capacity == null || body.capacity === undefined
                ? null
                : Number(body.capacity);
        if (
            capacity != null &&
            (!Number.isFinite(capacity) || capacity < 5 || capacity > 40)
        ) {
            return {
                ok: false,
                message: "capacity should be between 5 and 40 students",
            };
        }
        return {
            ok: true,
            data: {
                sessionType,
                dayOfWeek,
                startTime,
                endTime,
                location: body.location?.trim() ? body.location.trim() : null,
                capacity,
            },
        };
    }

    listAssigned = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const lecturerId = req.user?.userId;
            if (!lecturerId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const semester = typeof req.query.semester === "string"
                ? req.query.semester.trim()
                : "";

            const assignments = await this.assignmentRepository.find({
                where: { lecturerId },
                relations: ["course"],
                order: { assignedAt: "DESC" },
            });

            let courses = assignments
                .map((row) => row.course)
                .filter(Boolean) as Course[];
            if (semester) {
                courses = courses.filter((course) => course.semester === semester);
            }

            const courseIds = courses.map((course) => course.id);
            const [sessions, pendingRequests] = await Promise.all([
                courseIds.length
                    ? this.sessionRepository
                          .createQueryBuilder("session")
                          .where("session.courseId IN (:...courseIds)", {
                              courseIds,
                          })
                          .getMany()
                    : Promise.resolve([] as CourseSession[]),
                courseIds.length
                    ? this.requestRepository
                          .createQueryBuilder("request")
                          .where("request.courseId IN (:...courseIds)", {
                              courseIds,
                          })
                          .andWhere("request.status = :status", {
                              status: "pending",
                          })
                          .orderBy("request.createdAt", "DESC")
                          .getMany()
                    : Promise.resolve([] as CourseChangeRequest[]),
            ]);

            const payload = courses.map((course) =>
                serializeCourse(
                    course,
                    sessions.filter((session) => session.courseId === course.id),
                    pendingRequests.filter(
                        (request) => request.courseId === course.id
                    )
                )
            );

            res.json({ success: true, data: { courses: payload } });
        } catch (error) {
            console.error("listAssigned courses failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to load assigned courses",
            });
        }
    };

    getTimetable = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const lecturerId = req.user?.userId;
            if (!lecturerId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const assignments = await this.assignmentRepository.find({
                where: { lecturerId },
                relations: ["course"],
            });
            const courses = assignments
                .map((row) => row.course)
                .filter(Boolean) as Course[];
            const courseIds = courses.map((course) => course.id);
            if (courseIds.length === 0) {
                res.json({ success: true, data: { entries: [] } });
                return;
            }

            const sessions = await this.sessionRepository
                .createQueryBuilder("session")
                .where("session.courseId IN (:...courseIds)", { courseIds })
                .orderBy("session.dayOfWeek", "ASC")
                .addOrderBy("session.startTime", "ASC")
                .getMany();

            const byId = new Map(courses.map((course) => [course.id, course]));
            const entries = sessions.map((session) => {
                const course = byId.get(session.courseId);
                return {
                    ...serializeSession(session),
                    courseCode: course?.courseCode ?? "",
                    courseName: course?.courseName ?? "",
                    semester: course?.semester ?? "",
                    isPublished: course?.isPublished ?? false,
                };
            });

            res.json({ success: true, data: { entries } });
        } catch (error) {
            console.error("getTimetable failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to load timetable",
            });
        }
    };

    updateCourseDetails = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const lecturerId = req.user?.userId;
            const courseId = req.params.courseId;
            if (!lecturerId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const course = await this.requireAssignedCourse(lecturerId, courseId);
            if (!course) {
                res.status(404).json({
                    success: false,
                    message: "Course not found or not assigned to you",
                });
                return;
            }

            const description =
                typeof req.body.description === "string"
                    ? req.body.description.trim()
                    : undefined;
            const maxTutors =
                req.body.maxTutors == null
                    ? undefined
                    : Number(req.body.maxTutors);
            const maxLabAssistants =
                req.body.maxLabAssistants == null
                    ? undefined
                    : Number(req.body.maxLabAssistants);
            const studentsPerClass =
                req.body.studentsPerClass == null
                    ? undefined
                    : Number(req.body.studentsPerClass);

            if (
                maxTutors != null &&
                (!Number.isFinite(maxTutors) || maxTutors < 0 || maxTutors > 50)
            ) {
                res.status(400).json({
                    success: false,
                    message: "maxTutors must be between 0 and 50",
                });
                return;
            }
            if (
                maxLabAssistants != null &&
                (!Number.isFinite(maxLabAssistants) ||
                    maxLabAssistants < 0 ||
                    maxLabAssistants > 50)
            ) {
                res.status(400).json({
                    success: false,
                    message: "maxLabAssistants must be between 0 and 50",
                });
                return;
            }
            if (
                studentsPerClass != null &&
                (!Number.isFinite(studentsPerClass) ||
                    studentsPerClass < 5 ||
                    studentsPerClass > 40)
            ) {
                res.status(400).json({
                    success: false,
                    message: "studentsPerClass should be between 5 and 40",
                });
                return;
            }

            const contentChanged =
                description !== undefined && description !== (course.description ?? "");
            const capacityChanged =
                (maxTutors != null && maxTutors !== course.maxTutors) ||
                (maxLabAssistants != null &&
                    maxLabAssistants !== course.maxLabAssistants) ||
                (studentsPerClass != null &&
                    studentsPerClass !== course.studentsPerClass);

            if (!contentChanged && !capacityChanged) {
                res.json({
                    success: true,
                    message: "No changes",
                    data: { courseId: course.id, requiresApproval: false },
                });
                return;
            }

            if (!course.isPublished) {
                if (description !== undefined) course.description = description;
                if (maxTutors != null) course.maxTutors = maxTutors;
                if (maxLabAssistants != null) {
                    course.maxLabAssistants = maxLabAssistants;
                }
                if (studentsPerClass != null) {
                    course.studentsPerClass = studentsPerClass;
                }
                await this.courseRepository.save(course);
                res.json({
                    success: true,
                    message: "Course updated",
                    data: { courseId: course.id, requiresApproval: false },
                });
                return;
            }

            const created: CourseChangeRequest[] = [];
            if (contentChanged) {
                created.push(
                    this.requestRepository.create({
                        courseId: course.id,
                        requestedById: lecturerId,
                        requestType: "content" as CourseChangeRequestType,
                        payload: { description },
                        status: "pending",
                    })
                );
            }
            if (capacityChanged) {
                created.push(
                    this.requestRepository.create({
                        courseId: course.id,
                        requestedById: lecturerId,
                        requestType: "capacity" as CourseChangeRequestType,
                        payload: {
                            maxTutors: maxTutors ?? course.maxTutors,
                            maxLabAssistants:
                                maxLabAssistants ?? course.maxLabAssistants,
                            studentsPerClass:
                                studentsPerClass ?? course.studentsPerClass,
                        },
                        status: "pending",
                    })
                );
            }
            await this.requestRepository.save(created);

            res.json({
                success: true,
                message:
                    "Course is published. Your edits were submitted for admin approval.",
                data: {
                    courseId: course.id,
                    requiresApproval: true,
                    requestIds: created.map((row) => row.id),
                },
            });
        } catch (error) {
            console.error("updateCourseDetails failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update course",
            });
        }
    };

    replaceSessions = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const lecturerId = req.user?.userId;
            const courseId = req.params.courseId;
            if (!lecturerId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const course = await this.requireAssignedCourse(lecturerId, courseId);
            if (!course) {
                res.status(404).json({
                    success: false,
                    message: "Course not found or not assigned to you",
                });
                return;
            }

            const rawSessions = Array.isArray(req.body.sessions)
                ? req.body.sessions
                : null;
            if (!rawSessions) {
                res.status(400).json({
                    success: false,
                    message: "sessions array is required",
                });
                return;
            }

            const parsed = [];
            for (const row of rawSessions) {
                const result = this.validateSessionInput(row);
                if (!result.ok) {
                    res.status(400).json({ success: false, message: result.message });
                    return;
                }
                parsed.push(result.data);
            }

            const lectureCount = parsed.filter(
                (row) => row.sessionType === "lecture"
            ).length;
            if (lectureCount !== 1) {
                res.status(400).json({
                    success: false,
                    message: "Each course needs exactly one lecture session (2 hours)",
                });
                return;
            }

            if (!course.isPublished) {
                await this.sessionRepository.delete({ courseId: course.id });
                const entities = parsed.map((row, index) =>
                    this.sessionRepository.create({
                        courseId: course.id,
                        sessionType: row.sessionType,
                        dayOfWeek: row.dayOfWeek,
                        startTime: row.startTime,
                        endTime: row.endTime,
                        location: row.location,
                        capacity:
                            row.capacity ??
                            (row.sessionType === "tutorial"
                                ? course.studentsPerClass
                                : null),
                        sortOrder: index,
                    })
                );
                const saved = await this.sessionRepository.save(entities);
                res.json({
                    success: true,
                    message: "Schedule saved",
                    data: {
                        requiresApproval: false,
                        sessions: saved.map(serializeSession),
                    },
                });
                return;
            }

            const request = this.requestRepository.create({
                courseId: course.id,
                requestedById: lecturerId,
                requestType: "schedule",
                payload: { sessions: parsed },
                status: "pending",
            });
            await this.requestRepository.save(request);

            res.json({
                success: true,
                message:
                    "Course is published. Schedule changes were submitted for admin approval.",
                data: { requiresApproval: true, requestId: request.id },
            });
        } catch (error) {
            console.error("replaceSessions failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to save schedule",
            });
        }
    };

    uploadCoverImage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const lecturerId = req.user?.userId;
            const courseId = req.params.courseId;
            if (!lecturerId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const course = await this.requireAssignedCourse(lecturerId, courseId);
            if (!course) {
                res.status(404).json({
                    success: false,
                    message: "Course not found or not assigned",
                });
                return;
            }

            const file = req.file;
            if (!file) {
                res.status(400).json({
                    success: false,
                    message: "Cover image file is required",
                });
                return;
            }

            const previous = course.coverImageUrl;
            const coverImageUrl = buildCourseCoverPublicPath(file.filename);
            course.coverImageUrl = coverImageUrl;
            await this.courseRepository.save(course);
            deleteCourseCoverFileIfExists(previous);

            res.json({
                success: true,
                message: "Course cover updated",
                data: { coverImageUrl },
            });
        } catch (error) {
            console.error("uploadCoverImage failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to upload course cover",
            });
        }
    };

    deleteCoverImage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const lecturerId = req.user?.userId;
            const courseId = req.params.courseId;
            if (!lecturerId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const course = await this.requireAssignedCourse(lecturerId, courseId);
            if (!course) {
                res.status(404).json({
                    success: false,
                    message: "Course not found or not assigned",
                });
                return;
            }

            const previous = course.coverImageUrl;
            course.coverImageUrl = null;
            await this.courseRepository.save(course);
            deleteCourseCoverFileIfExists(previous);

            res.json({
                success: true,
                message: "Course cover removed",
                data: { coverImageUrl: null },
            });
        } catch (error) {
            console.error("deleteCoverImage failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to remove course cover",
            });
        }
    };
}
