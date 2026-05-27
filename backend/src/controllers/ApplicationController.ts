import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Application, ApplicationStatus } from "../entities/Application";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { User, UserType } from "../entities/User";
import { CourseAssignment } from "../entities/CourseAssignment";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { validateApplicationData } from "../utils/validation";
import { NotificationService } from "../services/NotificationService";
import { NotificationType } from "../entities/Notification";
import { assertCourseAcceptsApplications, getCourseApplicationWindow } from "../utils/courseDeadline";
import { ApplicationDraft } from "../entities/ApplicationDraft";

export class ApplicationController {
    private applicationRepository = AppDataSource.getRepository(Application);
    private courseRepository = AppDataSource.getRepository(Course);
    private roleRepository = AppDataSource.getRepository(Role);
    private userRepository = AppDataSource.getRepository(User);
    private courseAssignmentRepository =
        AppDataSource.getRepository(CourseAssignment);
    private selectedCandidateRepository =
        AppDataSource.getRepository(SelectedCandidate);
    private draftRepository = AppDataSource.getRepository(ApplicationDraft);

    // PA Part C: Create new application
    async createApplication(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const {
                courseId,
                roleId,
                availability,
                skills,
                experience,
                motivation,
            } = req.body;
            const candidateId = req.user?.userId;



            // Validate input
            const validation = validateApplicationData(req.body);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: "",
                    errors: validation.errors,
                });
                return;
            }

            // Verify user is a candidate
            const candidate = await this.userRepository.findOne({
                where: { id: candidateId, userType: UserType.CANDIDATE },
            });

            if (!candidate) {
                res.status(403).json({
                    success: false,
                    message: "Only candidates can submit applications",
                });
                return;
            }

            // Verify course and role exist
            const course = await this.courseRepository.findOne({
                where: { id: courseId },
            });
            const role = await this.roleRepository.findOne({
                where: { id: roleId },
            });

            if (!course || !role) {
                res.status(404).json({
                    success: false,
                    message: "Course or role not found",
                });
                return;
            }

            const deadlineCheck = assertCourseAcceptsApplications(course);
            if (!deadlineCheck.ok) {
                res.status(400).json({
                    success: false,
                    message: deadlineCheck.message,
                });
                return;
            }

            // Check for duplicate application
            const existingApplication =
                await this.applicationRepository.findOne({
                    where: {
                        candidateId,
                        courseId,
                        roleId,
                    },
                });

            if (existingApplication) {
                res.status(409).json({
                    success: false,
                    message: `You have already applied for ${role.roleName} role in ${course.courseCode}`,
                });
                return;
            }

            // Create new application
            const newApplication = this.applicationRepository.create({
                candidateId,
                courseId,
                roleId,
                availability: { type: availability }, // Store as JSON
                skills,
                experience,
                motivation,
                status: ApplicationStatus.PENDING,
            });

            const savedApplication = await this.applicationRepository.save(
                newApplication
            );

            await this.draftRepository.delete({
                candidateId,
                courseId,
                roleId,
            });

            const candidateName = `${candidate.firstName} ${candidate.lastName}`;
            await NotificationService.notifyLecturersForCourse(courseId, {
                type: NotificationType.APPLICATION_SUBMITTED,
                title: "New application",
                message: `${candidateName} applied for ${role.roleName} in ${course.courseCode}`,
                link: "/lecturer",
                metadata: {
                    applicationId: savedApplication.id,
                    courseId,
                    candidateId,
                },
            });

            res.status(201).json({
                success: true,
                message: "Application submitted successfully",
                data: savedApplication,
            });
        } catch (error) {
            console.error("Error creating application:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // PA Part C: Get candidate's applications
    async getMyCandidateApplications(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const candidateId = req.user?.userId;

            const applications = await this.applicationRepository.find({
                where: { candidateId },
                relations: ["course", "role"],
                order: { appliedAt: "DESC" },
            });

            res.status(200).json({
                success: true,
                data: applications,
            });
        } catch (error) {
            console.error("Error fetching candidate applications:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // PA Part C: Get available courses and roles for candidates
    async getCoursesAndRoles(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const courses = await this.courseRepository.find({
                order: { courseCode: "ASC" },
            });

            const roles = await this.roleRepository.find({
                order: { roleName: "ASC" },
            });

            // Calculate available positions for each course by subtracting selected applications
            const coursesWithAvailablePositions = await Promise.all(
                courses.map(async (course) => {
                    // Count selected applications for tutors
                    const selectedTutors =
                        await this.applicationRepository.count({
                            where: {
                                courseId: course.id,
                                status: ApplicationStatus.SELECTED,
                                role: { roleName: "tutor" },
                            },
                            relations: ["role"],
                        });

                    // Count selected applications for lab assistants
                    const selectedLabAssistants =
                        await this.applicationRepository.count({
                            where: {
                                courseId: course.id,
                                status: ApplicationStatus.SELECTED,
                                role: { roleName: "lab_assistant" },
                            },
                            relations: ["role"],
                        });

                    // Calculate available positions
                    const availableTutors = Math.max(
                        0,
                        course.maxTutors - selectedTutors
                    );
                    const availableLabAssistants = Math.max(
                        0,
                        course.maxLabAssistants - selectedLabAssistants
                    );

                    const applicationWindow = getCourseApplicationWindow(course);

                    return {
                        ...course,
                        // Keep original max positions
                        maxTutors: course.maxTutors,
                        maxLabAssistants: course.maxLabAssistants,
                        // Add available positions as separate fields
                        availableTutors,
                        availableLabAssistants,
                        selectedTutors,
                        selectedLabAssistants,
                        applicationDeadline: applicationWindow.applicationDeadline,
                        isApplicationOpen: applicationWindow.isApplicationOpen,
                        closesInMs: applicationWindow.closesInMs,
                    };
                })
            );

            res.status(200).json({
                success: true,
                data: { courses: coursesWithAvailablePositions, roles },
            });
        } catch (error) {
            console.error("Error fetching courses and roles:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // CR Part: Get applications with advanced filtering for lecturers
    async getApplicationsForLecturer(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const lecturerId = req.user?.userId;
            const {
                candidateName,
                roleType,
                availability,
                skills,
                courseCode,
                status = "all",
            } = req.query;



            // Verify user is a lecturer
            const lecturer = await this.userRepository.findOne({
                where: { id: lecturerId, userType: UserType.LECTURER },
            });

            if (!lecturer) {
                res.status(403).json({
                    success: false,
                    message: "Only lecturers can access applications",
                });
                return;
            }

            // Get lecturer's assigned courses
            const courseAssignments =
                await this.courseAssignmentRepository.find({
                    where: { lecturerId },
                    relations: ["course"],
                });

            const assignedCourseIds = courseAssignments.map(
                (ca) => ca.courseId
            );

            if (assignedCourseIds.length === 0) {
                res.status(200).json({
                    success: true,
                    data: [],
                    message: "No courses assigned to this lecturer",
                });
                return;
            }

            // Build query with filters
            const queryBuilder = this.applicationRepository
                .createQueryBuilder("application")
                .leftJoinAndSelect("application.candidate", "candidate")
                .leftJoinAndSelect("application.course", "course")
                .leftJoinAndSelect("application.role", "role")
                .where("application.courseId IN (:...courseIds)", {
                    courseIds: assignedCourseIds,
                });

            // Apply filters
            if (candidateName) {
                queryBuilder.andWhere(
                    "(LOWER(candidate.firstName) LIKE LOWER(:name) OR LOWER(candidate.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(candidate.firstName, ' ', candidate.lastName)) LIKE LOWER(:name))",
                    { name: `%${candidateName}%` }
                );
            }

            if (roleType && roleType !== "all") {
                queryBuilder.andWhere("role.roleName = :roleType", {
                    roleType,
                });
            }

            if (availability && availability !== "all") {
                queryBuilder.andWhere(
                    "JSON_UNQUOTE(JSON_EXTRACT(application.availability, '$.type')) = :availability",
                    { availability }
                );
            }

            if (skills) {
                queryBuilder.andWhere(
                    "LOWER(application.skills) LIKE LOWER(:skills)",
                    {
                        skills: `%${skills}%`,
                    }
                );
            }

            if (courseCode && courseCode !== "all") {
                queryBuilder.andWhere("course.courseCode = :courseCode", {
                    courseCode,
                });
            }

            if (status && status !== "all") {
                queryBuilder.andWhere("application.status = :status", {
                    status,
                });
            }

            // Order by application date (newest first)
            queryBuilder.orderBy("application.appliedAt", "DESC");

            const applications = await queryBuilder.getMany();



            res.status(200).json({
                success: true,
                data: applications,
            });
        } catch (error) {
            console.error("Error fetching lecturer applications:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // DI Part: Get application statistics for visualization
    async getApplicationStatistics(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const lecturerId = req.user?.userId;

            // Verify user is a lecturer
            const lecturer = await this.userRepository.findOne({
                where: { id: lecturerId, userType: UserType.LECTURER },
            });

            if (!lecturer) {
                res.status(403).json({
                    success: false,
                    message: "Only lecturers can access statistics",
                });
                return;
            }

            // Get lecturer's assigned courses
            const courseAssignments =
                await this.courseAssignmentRepository.find({
                    where: { lecturerId },
                    relations: ["course"],
                });

            const assignedCourseIds = courseAssignments.map(
                (ca) => ca.courseId
            );

            if (assignedCourseIds.length === 0) {
                res.status(200).json({
                    success: true,
                    data: {
                        totalApplications: 0,
                        applicationsByRole: { tutor: 0, lab_assistant: 0 },
                        applicationsByCourse: [],
                        applicationsByStatus: {
                            pending: 0,
                            selected: 0,
                            rejected: 0,
                        },
                        skillFrequency: [],
                        availabilityDistribution: { partTime: 0, fullTime: 0 },
                    },
                });
                return;
            }

            // Get all applications for assigned courses
            const applications = await this.applicationRepository.find({
                where: assignedCourseIds.map((courseId) => ({ courseId })),
                relations: ["course", "role", "candidate"],
            });

            // Calculate statistics
            const stats = {
                totalApplications: applications.length,
                applicationsByRole: {
                    tutor: applications.filter(
                        (app) => app.role.roleName === "tutor"
                    ).length,
                    lab_assistant: applications.filter(
                        (app) => app.role.roleName === "lab_assistant"
                    ).length,
                },
                applicationsByCourse: this.groupByCourse(applications),
                applicationsByStatus: {
                    pending: applications.filter(
                        (app) => app.status === ApplicationStatus.PENDING
                    ).length,
                    selected: applications.filter(
                        (app) => app.status === ApplicationStatus.SELECTED
                    ).length,
                    rejected: applications.filter(
                        (app) => app.status === ApplicationStatus.REJECTED
                    ).length,
                },
                skillFrequency: this.calculateSkillFrequency(applications),
                availabilityDistribution:
                    this.calculateAvailabilityDistribution(applications),
            };

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Error fetching application statistics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // CR Part: Update application status
    async updateApplicationStatus(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["course", "role", "candidate"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Verify lecturer has access to this application's course
            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            // If selecting an application, check if positions are available
            if (status === ApplicationStatus.SELECTED) {
                // Get the course to check max positions
                const course = application.course;

                // Count currently selected applications for this role in this course
                const selectedCount = await this.applicationRepository.count({
                    where: {
                        courseId: application.courseId,
                        status: ApplicationStatus.SELECTED,
                        role: { roleName: application.role.roleName },
                    },
                    relations: ["role"],
                });

                // Check if positions are available
                const maxPositions =
                    application.role.roleName === "tutor"
                        ? course.maxTutors
                        : course.maxLabAssistants;

                if (selectedCount >= maxPositions) {
                    res.status(400).json({
                        success: false,
                        message: `No positions available for ${application.role.roleName} role in ${course.courseCode}. All ${maxPositions} positions are filled.`,
                    });
                    return;
                }
            }

            // Update application status
            application.status = status;
            const updatedApplication = await this.applicationRepository.save(
                application
            );

            // If selected, create SelectedCandidate record
            if (status === ApplicationStatus.SELECTED) {
                const existingSelection =
                    await this.selectedCandidateRepository.findOne({
                        where: { applicationId: application.id },
                    });

                if (!existingSelection) {
                    const selection = this.selectedCandidateRepository.create({
                        applicationId: application.id,
                        selectedById: lecturerId,
                    });
                    await this.selectedCandidateRepository.save(selection);
                }
            }

            const statusNotificationMap: Partial<
                Record<
                    ApplicationStatus,
                    { type: NotificationType; title: string; message: string }
                >
            > = {
                [ApplicationStatus.SELECTED]: {
                    type: NotificationType.APPLICATION_SELECTED,
                    title: "Application selected",
                    message: `You were selected for ${application.role.roleName} in ${application.course.courseCode}`,
                },
                [ApplicationStatus.REJECTED]: {
                    type: NotificationType.APPLICATION_REJECTED,
                    title: "Application update",
                    message: `Your application for ${application.role.roleName} in ${application.course.courseCode} was not selected`,
                },
                [ApplicationStatus.PENDING]: {
                    type: NotificationType.APPLICATION_SUBMITTED,
                    title: "Application update",
                    message: `Your application for ${application.role.roleName} in ${application.course.courseCode} is pending review`,
                },
            };

            const statusNotification =
                statusNotificationMap[status as ApplicationStatus];
            if (statusNotification) {
                await NotificationService.create({
                    userId: application.candidateId,
                    type: statusNotification.type,
                    title: statusNotification.title,
                    message: statusNotification.message,
                    link: "/tutor",
                    metadata: {
                        applicationId: application.id,
                        courseId: application.courseId,
                        status,
                    },
                });
            }

            res.status(200).json({
                success: true,
                message: "Application status updated successfully",
                data: updatedApplication,
            });
        } catch (error) {
            console.error("Error updating application status:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // Helper methods for statistics calculation
    private groupByCourse(
        applications: Application[]
    ): Array<{ course: string; count: number }> {
        const courseGroups = applications.reduce((acc, app) => {
            const courseKey = app.course.courseCode;
            acc[courseKey] = (acc[courseKey] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(courseGroups).map(([course, count]) => ({
            course,
            count,
        }));
    }

    private calculateSkillFrequency(
        applications: Application[]
    ): Array<{ skill: string; frequency: number }> {
        const skillCounts = {} as Record<string, number>;

        applications.forEach((app) => {
            if (app.skills) {
                // Split skills by common delimiters and normalize
                const skills = app.skills
                    .split(/[,;|\n]/)
                    .map((skill) => skill.trim().toLowerCase())
                    .filter((skill) => skill.length > 0);

                skills.forEach((skill) => {
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                });
            }
        });

        return Object.entries(skillCounts)
            .map(([skill, frequency]) => ({ skill, frequency }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 20); // Top 20 skills
    }

    private calculateAvailabilityDistribution(applications: Application[]): {
        partTime: number;
        fullTime: number;
    } {
        let partTime = 0;
        let fullTime = 0;

        applications.forEach((app) => {
            if (app.availability && typeof app.availability === "object") {
                const availabilityType = (app.availability as any).type;
                if (availabilityType === "Part Time") {
                    partTime++;
                } else if (availabilityType === "Full Time") {
                    fullTime++;
                }
            }
        });

        return { partTime, fullTime };
    }

    // PA Part D: Get assigned courses for lecturer
    async getAssignedCoursesForLecturer(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const lecturerId = req.user?.userId;



            // Verify user is a lecturer
            const lecturer = await this.userRepository.findOne({
                where: { id: lecturerId, userType: UserType.LECTURER },
            });

            if (!lecturer) {
                res.status(403).json({
                    success: false,
                    message: "Only lecturers can access assigned courses",
                });
                return;
            }

            // Get lecturer's assigned courses with course details
            const courseAssignments =
                await this.courseAssignmentRepository.find({
                    where: { lecturerId },
                    relations: ["course"],
                    order: { course: { courseCode: "ASC" } },
                });

            const assignedCourses = courseAssignments.map((ca) => ca.course);

            // Add position availability information for lecturers
            const coursesWithAvailability = await Promise.all(
                assignedCourses.map(async (course) => {
                    // Count selected applications for tutors
                    const selectedTutors =
                        await this.applicationRepository.count({
                            where: {
                                courseId: course.id,
                                status: ApplicationStatus.SELECTED,
                                role: { roleName: "tutor" },
                            },
                            relations: ["role"],
                        });

                    // Count selected applications for lab assistants
                    const selectedLabAssistants =
                        await this.applicationRepository.count({
                            where: {
                                courseId: course.id,
                                status: ApplicationStatus.SELECTED,
                                role: { roleName: "lab_assistant" },
                            },
                            relations: ["role"],
                        });

                    // Calculate available positions
                    const availableTutors = Math.max(
                        0,
                        course.maxTutors - selectedTutors
                    );
                    const availableLabAssistants = Math.max(
                        0,
                        course.maxLabAssistants - selectedLabAssistants
                    );

                    return {
                        ...course,
                        selectedTutors,
                        selectedLabAssistants,
                        availableTutors,
                        availableLabAssistants,
                    };
                })
            );

            res.status(200).json({
                success: true,
                data: coursesWithAvailability,
            });
        } catch (error) {
            console.error("Error fetching assigned courses:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // Comment management methods
    async updateApplicationComment(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["course", "role", "candidate"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Verify lecturer has access to this application's course
            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            // Update comment
            application.comment = comment || "";
            application.commentedBy = lecturerId;
            application.commentedAt = new Date();

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            if (comment && comment.trim().length > 0) {
                await NotificationService.create({
                    userId: application.candidateId,
                    type: NotificationType.APPLICATION_COMMENT,
                    title: "New feedback on your application",
                    message: `A lecturer left feedback on your ${application.role.roleName} application for ${application.course.courseCode}`,
                    link: "/tutor",
                    metadata: {
                        applicationId: application.id,
                        courseId: application.courseId,
                    },
                });
            }

            res.status(200).json({
                success: true,
                message: "Comment updated successfully",
                data: updatedApplication,
            });
        } catch (error) {
            console.error("Error updating application comment:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async deleteApplicationComment(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["course", "role", "candidate"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Verify lecturer has access to this application's course
            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            // Clear comment
            application.comment = "";
            application.commentedBy = undefined;
            application.commentedAt = undefined;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully",
                data: updatedApplication,
            });
        } catch (error) {
            console.error("Error deleting application comment:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // Ranking management methods
    async addApplicationToRanking(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const { rank, courseCode } = req.body;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["course", "role", "candidate"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Verify lecturer has access to this application's course
            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            // Verify application is selected
            if (application.status !== ApplicationStatus.SELECTED) {
                res.status(400).json({
                    success: false,
                    message:
                        "Application must be selected before adding to ranking",
                });
                return;
            }

            // Update ranking
            application.rank = rank;
            application.rankedBy = lecturerId;
            application.rankedAt = new Date();
            application.rankedForCourse = courseCode;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            res.status(200).json({
                success: true,
                message: "Application added to ranking successfully",
                data: updatedApplication,
            });
        } catch (error) {
            console.error("Error adding application to ranking:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async updateApplicationRanking(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const { rank, courseCode } = req.body;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["course", "role", "candidate"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Verify lecturer has access to this application's course
            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            // Update ranking
            application.rank = rank;
            application.rankedBy = lecturerId;
            application.rankedAt = new Date();
            application.rankedForCourse = courseCode;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            res.status(200).json({
                success: true,
                message: "Application ranking updated successfully",
                data: updatedApplication,
            });
        } catch (error) {
            console.error("Error updating application ranking:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async removeApplicationFromRanking(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {

        try {
            const { id } = req.params;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["course", "role", "candidate"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Verify lecturer has access to this application's course
            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            // Remove ranking - set to null for MySQL compatibility
            application.rank = null;
            application.rankedBy = null;
            application.rankedAt = null;
            application.rankedForCourse = null;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            res.status(200).json({
                success: true,
                message: "Application removed from ranking successfully",
                data: updatedApplication,
            });
        } catch (error) {
            console.error("Error removing application from ranking:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async getLecturerNotes(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const lecturerId = req.user?.userId;
            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10) },
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { lecturerNotes: application.lecturerNotes ?? "" },
            });
        } catch (error) {
            console.error("getLecturerNotes error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async updateLecturerNotes(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const lecturerId = req.user?.userId;
            const notes =
                typeof req.body.lecturerNotes === "string"
                    ? req.body.lecturerNotes.trim()
                    : "";

            if (notes.length > 5000) {
                res.status(400).json({
                    success: false,
                    message: "Notes must be under 5000 characters",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10) },
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            const courseAssignment =
                await this.courseAssignmentRepository.findOne({
                    where: {
                        lecturerId,
                        courseId: application.courseId,
                    },
                });

            if (!courseAssignment) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            application.lecturerNotes = notes || null;
            await this.applicationRepository.save(application);

            res.status(200).json({
                success: true,
                message: "Private notes saved",
                data: { lecturerNotes: application.lecturerNotes },
            });
        } catch (error) {
            console.error("updateLecturerNotes error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // Test endpoint for debugging course validation
    async testCourseValidation(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { selectedCourses } = req.body;



            // Test the regex validation
            const testResults = selectedCourses?.map((course: string) => ({
                course,
                courseType: typeof course,
                trimmed: course?.trim(),
                regexTest: course
                    ? /^[A-Z]{4}\d{4}$/.test(course.trim())
                    : false,
                isValid:
                    course &&
                    typeof course === "string" &&
                    /^[A-Z]{4}\d{4}$/.test(course.trim()),
            }));

            res.status(200).json({
                success: true,
                data: {
                    input: selectedCourses,
                    testResults,
                    message: "Course validation test completed",
                },
            });
        } catch (error) {
            console.error("Error in test course validation:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}
