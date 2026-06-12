import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Application, ApplicationStatus, OfferResponse } from "../entities/Application";
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
import { notifyApplicationUpdated } from "../socket/applicationEvents";
import {
    isAllowedReactionEmoji,
    isReactableMessageId,
    normalizeMessageReactions,
    toggleUserReaction,
} from "../utils/messageReactions";
import { countActiveSelectedForRole } from "../utils/coursePositionCounts";
import {
    appendCandidateMessage,
    appendLecturerMessage,
    clearLecturerCorrespondence,
    deleteCorrespondenceMessage,
    updateCandidateMessage,
} from "../utils/correspondenceMessages";
import {
    respondIfWithdrawn,
    respondIfCandidateBlocked,
    respondIfCorrespondenceInactive,
    WITHDRAWN_REAPPLY_MESSAGE,
} from "../utils/applicationGuards";
import { appendDecisionAutoMessage } from "../utils/decisionCorrespondence";
import { touchApplicationReviewed } from "../utils/applicationReview";
import {
    sanitizeApplicationForCandidate,
    sanitizeApplicationsForCandidate,
} from "../utils/candidateApplicationView";
import {
    normalizePagination,
    paginatedResult,
} from "../utils/pagination";
import { ApplicationQueryService } from "../services/applicationQueryService";

export class ApplicationController {
    private applicationRepository = AppDataSource.getRepository(Application);
    private selectedCandidateRepository =
        AppDataSource.getRepository(SelectedCandidate);
    private courseRepository = AppDataSource.getRepository(Course);
    private roleRepository = AppDataSource.getRepository(Role);
    private userRepository = AppDataSource.getRepository(User);
    private courseAssignmentRepository =
        AppDataSource.getRepository(CourseAssignment);
    private draftRepository = AppDataSource.getRepository(ApplicationDraft);
    private applicationQueryService = new ApplicationQueryService();

    private async attachShortlistFlags<T extends Application>(
        applications: T[]
    ): Promise<Array<T & { isShortlisted: boolean }>> {
        if (applications.length === 0) {
            return [];
        }

        const applicationIds = applications.map((application) => application.id);
        const selections = await this.selectedCandidateRepository
            .createQueryBuilder("selection")
            .where("selection.applicationId IN (:...applicationIds)", {
                applicationIds,
            })
            .getMany();

        const shortlistedIds = new Set(
            selections.map((selection) => selection.applicationId)
        );

        return applications.map((application) => ({
            ...application,
            isShortlisted: shortlistedIds.has(application.id),
        }));
    }

    private readonly applicationDetailRelations = [
        "course",
        "course.courseAssignments",
        "course.courseAssignments.lecturer",
        "role",
        "candidate",
        "commentedByUser",
    ] as const;

    private async loadApplicationForResponse(
        id: number
    ): Promise<Application | null> {
        return this.applicationRepository.findOne({
            where: { id },
            relations: [...this.applicationDetailRelations],
        });
    }

    private async verifyLecturerCourseAccess(
        lecturerId: number | undefined,
        courseId: number
    ): Promise<boolean> {
        if (!lecturerId) return false;

        const courseAssignment =
            await this.courseAssignmentRepository.findOne({
                where: {
                    lecturerId,
                    courseId,
                },
            });

        return Boolean(courseAssignment);
    }

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
                const message = existingApplication.isWithdrawn
                    ? WITHDRAWN_REAPPLY_MESSAGE
                    : `You have already applied for ${role.roleName} role in ${course.courseCode}`;
                res.status(409).json({
                    success: false,
                    message,
                    code: existingApplication.isWithdrawn
                        ? "APPLICATION_WITHDRAWN"
                        : "DUPLICATE_APPLICATION",
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
            const applicationSubmittedMeta = {
                applicationId: savedApplication.id,
                courseId,
                candidateId,
            };

            await NotificationService.notifyLecturersForCourse(courseId, {
                type: NotificationType.APPLICATION_SUBMITTED,
                title: "New application",
                message: `${candidateName} applied for ${role.roleName} in ${course.courseCode}`,
                link: "/lecturer",
                metadata: applicationSubmittedMeta,
            });

            await NotificationService.notifyAdmins({
                type: NotificationType.APPLICATION_SUBMITTED,
                title: "New application",
                message: `${candidateName} applied for ${role.roleName} in ${course.courseCode}`,
                link: "/dashboard",
                metadata: applicationSubmittedMeta,
            });

            await NotificationService.create({
                userId: candidate.id,
                type: NotificationType.APPLICATION_SUBMITTED,
                title: "Application submitted",
                message: `Your ${role.roleName} application for ${course.courseCode} was submitted and is pending review`,
                link: "/tutor",
                metadata: {
                    applicationId: savedApplication.id,
                    courseId,
                    candidateId: candidate.id,
                    status: ApplicationStatus.PENDING,
                },
            });

            void notifyApplicationUpdated(savedApplication.id, "created");

            res.status(201).json({
                success: true,
                message: "Application submitted successfully",
                data: sanitizeApplicationForCandidate(savedApplication),
            });
        } catch (error) {
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
                relations: [
                    "course",
                    "course.courseAssignments",
                    "course.courseAssignments.lecturer",
                    "role",
                    "commentedByUser",
                ],
                order: { appliedAt: "DESC" },
            });

            res.status(200).json({
                success: true,
                data: sanitizeApplicationsForCandidate(applications),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async getApplicationById(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const applicationId = parseInt(req.params.id, 10);
            const userId = req.user?.userId;
            const userType = req.user?.userType;

            if (!userId || !userType) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Invalid application id",
                });
                return;
            }

            const application = await this.loadApplicationForResponse(
                applicationId
            );

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (userType === UserType.CANDIDATE) {
                if (application.candidateId !== userId) {
                    res.status(403).json({
                        success: false,
                        message: "You do not have access to this application",
                    });
                    return;
                }

                res.status(200).json({
                    success: true,
                    data: sanitizeApplicationForCandidate(application),
                });
                return;
            }

            if (userType === UserType.LECTURER) {
                const hasAccess = await this.verifyLecturerCourseAccess(
                    userId,
                    application.courseId
                );
                if (!hasAccess) {
                    res.status(403).json({
                        success: false,
                        message: "You don't have access to this application",
                    });
                    return;
                }

                const [withShortlist] = await this.attachShortlistFlags([
                    application,
                ]);

                res.status(200).json({
                    success: true,
                    data: withShortlist,
                });
                return;
            }

            res.status(403).json({
                success: false,
                message: "Access denied",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async updateCandidateResponse(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const candidateId = req.user?.userId;
            if (!candidateId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const responseText =
                typeof req.body.response === "string" ? req.body.response.trim() : "";
            const replyToMessageId =
                typeof req.body.replyToMessageId === "string"
                    ? req.body.replyToMessageId
                    : null;

            if (responseText.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Response cannot be empty",
                });
                return;
            }

            if (responseText.length > 3000) {
                res.status(400).json({
                    success: false,
                    message: "Response must be under 3000 characters",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10), candidateId },
                relations: ["course", "role"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            if (respondIfCorrespondenceInactive(application, res)) {
                return;
            }

            appendCandidateMessage(
                application,
                candidateId,
                responseText,
                replyToMessageId
            );
            const updatedApplication = await this.applicationRepository.save(
                application
            );

            const candidateResponseMeta = {
                applicationId: application.id,
                candidateId,
                courseId: application.courseId,
            };
            const candidateResponseMessage = `Candidate sent additional details for ${application.role.roleName} in ${application.course.courseCode}`;

            await NotificationService.notifyLecturersForCourse(application.courseId, {
                type: NotificationType.APPLICATION_RESPONSE,
                title: "Candidate sent more details",
                message: candidateResponseMessage,
                link: "/lecturer",
                metadata: candidateResponseMeta,
            });

            await NotificationService.notifyAdmins({
                type: NotificationType.APPLICATION_RESPONSE,
                title: "Candidate sent more details",
                message: candidateResponseMessage,
                link: "/dashboard",
                metadata: candidateResponseMeta,
            });

            void notifyApplicationUpdated(application.id, "candidate_response");

            res.status(200).json({
                success: true,
                message: "Response sent successfully",
                data: sanitizeApplicationForCandidate(updatedApplication),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async respondToOffer(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const candidateId = req.user?.userId;
            if (!candidateId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const decision =
                req.body.decision === "accept"
                    ? OfferResponse.ACCEPTED
                    : req.body.decision === "decline"
                      ? OfferResponse.DECLINED
                      : null;

            const messageText =
                typeof req.body.message === "string"
                    ? req.body.message.trim()
                    : "";

            if (!decision) {
                res.status(400).json({
                    success: false,
                    message: "Decision must be accept or decline",
                });
                return;
            }

            if (!messageText) {
                res.status(400).json({
                    success: false,
                    message: "Please include a message with your response",
                });
                return;
            }

            if (messageText.length > 3000) {
                res.status(400).json({
                    success: false,
                    message: "Message must be under 3000 characters",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10), candidateId },
                relations: ["course", "role"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            if (application.status !== ApplicationStatus.SELECTED) {
                res.status(400).json({
                    success: false,
                    message: "Offer response is only available for selected applications",
                });
                return;
            }

            if (
                application.offerResponse &&
                application.offerResponse !== OfferResponse.PENDING
            ) {
                res.status(400).json({
                    success: false,
                    message: "You have already responded to this offer",
                });
                return;
            }

            appendCandidateMessage(application, candidateId, messageText);
            application.offerResponse = decision;
            application.offerRespondedAt = new Date();

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            const decisionLabel =
                decision === OfferResponse.ACCEPTED ? "accepted" : "declined";

            const offerResponseMeta = {
                applicationId: application.id,
                candidateId,
                courseId: application.courseId,
                offerResponse: decision,
            };
            const offerResponseTitle =
                decision === OfferResponse.ACCEPTED
                    ? "Candidate accepted offer"
                    : "Candidate declined offer";
            const offerResponseMessage = `Candidate ${decisionLabel} the ${application.role.roleName} offer for ${application.course.courseCode}`;

            await NotificationService.notifyLecturersForCourse(application.courseId, {
                type: NotificationType.APPLICATION_RESPONSE,
                title: offerResponseTitle,
                message: offerResponseMessage,
                link: "/lecturer",
                metadata: offerResponseMeta,
            });

            await NotificationService.notifyAdmins({
                type: NotificationType.APPLICATION_RESPONSE,
                title: offerResponseTitle,
                message: offerResponseMessage,
                link: "/dashboard",
                metadata: offerResponseMeta,
            });

            void notifyApplicationUpdated(application.id, "offer_response");

            const responseApplication =
                (await this.loadApplicationForResponse(updatedApplication.id)) ??
                updatedApplication;

            res.status(200).json({
                success: true,
                message:
                    decision === OfferResponse.ACCEPTED
                        ? "Offer accepted"
                        : "Offer declined",
                data: sanitizeApplicationForCandidate(responseApplication),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async deleteCandidateResponse(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const candidateId = req.user?.userId;
            if (!candidateId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10), candidateId },
                relations: [
                    "course",
                    "course.courseAssignments",
                    "course.courseAssignments.lecturer",
                    "role",
                    "commentedByUser",
                ],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            const messageId =
                typeof req.body.messageId === "string"
                    ? req.body.messageId.trim()
                    : typeof req.query.messageId === "string"
                      ? req.query.messageId.trim()
                      : "";

            if (!messageId) {
                res.status(400).json({
                    success: false,
                    message: "messageId is required",
                });
                return;
            }

            const deleted = deleteCorrespondenceMessage(
                application,
                candidateId,
                messageId
            );

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: "Message not found",
                });
                return;
            }

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            void notifyApplicationUpdated(
                application.id,
                "candidate_response"
            );

            res.status(200).json({
                success: true,
                message: "Message deleted",
                data: sanitizeApplicationForCandidate(updatedApplication),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async editCorrespondenceMessage(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const candidateId = req.user?.userId;
            if (!candidateId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const messageId =
                typeof req.body.messageId === "string"
                    ? req.body.messageId.trim()
                    : "";
            const body =
                typeof req.body.response === "string"
                    ? req.body.response.trim()
                    : "";

            if (!messageId) {
                res.status(400).json({
                    success: false,
                    message: "messageId is required",
                });
                return;
            }

            if (body.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Response cannot be empty",
                });
                return;
            }

            if (body.length > 3000) {
                res.status(400).json({
                    success: false,
                    message: "Response must be under 3000 characters",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10), candidateId },
                relations: [
                    "course",
                    "course.courseAssignments",
                    "course.courseAssignments.lecturer",
                    "role",
                    "commentedByUser",
                ],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            const updated = updateCandidateMessage(
                application,
                candidateId,
                messageId,
                body
            );

            if (!updated) {
                res.status(400).json({
                    success: false,
                    message:
                        "Message not found or edit window expired (2 minutes)",
                });
                return;
            }

            const saved = await this.applicationRepository.save(application);
            void notifyApplicationUpdated(application.id, "candidate_response");

            res.status(200).json({
                success: true,
                message: "Message updated",
                data: sanitizeApplicationForCandidate(saved),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async withdrawApplication(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const candidateId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10), candidateId },
                relations: ["course", "role"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (application.isWithdrawn) {
                res.status(400).json({
                    success: false,
                    message: "Application already withdrawn",
                });
                return;
            }

            application.status = ApplicationStatus.REJECTED;
            application.isWithdrawn = true;
            application.withdrawnAt = new Date();

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            const withdrawnMeta = {
                applicationId: application.id,
                candidateId,
                courseId: application.courseId,
            };
            const withdrawnMessage = `A candidate withdrew ${application.role.roleName} application in ${application.course.courseCode}`;

            await NotificationService.notifyLecturersForCourse(application.courseId, {
                type: NotificationType.APPLICATION_WITHDRAWN,
                title: "Application withdrawn",
                message: withdrawnMessage,
                link: "/lecturer",
                metadata: withdrawnMeta,
            });

            await NotificationService.notifyAdmins({
                type: NotificationType.APPLICATION_WITHDRAWN,
                title: "Application withdrawn",
                message: withdrawnMessage,
                link: "/dashboard",
                metadata: withdrawnMeta,
            });

            void notifyApplicationUpdated(application.id, "withdrawn");

            res.status(200).json({
                success: true,
                message: "Application withdrawn successfully",
                data: sanitizeApplicationForCandidate(updatedApplication),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async toggleMessageReaction(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const messageId =
                typeof req.body.messageId === "string"
                    ? req.body.messageId.trim()
                    : "";
            const emoji =
                typeof req.body.emoji === "string" ? req.body.emoji.trim() : "";
            const userId = req.user?.userId;
            const userType = req.user?.userType;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            if (!isAllowedReactionEmoji(emoji)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid reaction",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10) },
                relations: ["course", "role"],
            });

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            if (userType === UserType.CANDIDATE) {
                if (application.candidateId !== userId) {
                    res.status(403).json({
                        success: false,
                        message: "You don't have access to this application",
                    });
                    return;
                }
            } else if (userType === UserType.LECTURER) {
                const courseAssignment =
                    await this.courseAssignmentRepository.findOne({
                        where: {
                            lecturerId: userId,
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
            } else {
                res.status(403).json({
                    success: false,
                    message: "Not allowed",
                });
                return;
            }

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            if (!isReactableMessageId(application, messageId)) {
                res.status(400).json({
                    success: false,
                    message: "This message cannot be reacted to",
                });
                return;
            }

            const reactions = normalizeMessageReactions(
                application.messageReactions
            );
            application.messageReactions = toggleUserReaction(
                reactions,
                messageId,
                emoji,
                userId
            );

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            void notifyApplicationUpdated(application.id, "reaction");

            const responseApplication =
                userType === UserType.CANDIDATE
                    ? sanitizeApplicationForCandidate(updatedApplication)
                    : updatedApplication;

            res.status(200).json({
                success: true,
                data: responseApplication,
            });
        } catch (error) {
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
                    const selectedTutors = await countActiveSelectedForRole(
                        this.applicationRepository,
                        course.id,
                        "tutor"
                    );

                    const selectedLabAssistants =
                        await countActiveSelectedForRole(
                            this.applicationRepository,
                            course.id,
                            "lab_assistant"
                        );

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
            if (!lecturerId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }

            const result =
                await this.applicationQueryService.getLecturerApplicationsPaginated(
                    lecturerId,
                    {
                        candidateName: req.query.candidateName as
                            | string
                            | undefined,
                        roleType: req.query.roleType as string | undefined,
                        availability: req.query.availability as
                            | string
                            | undefined,
                        skills: req.query.skills as string | undefined,
                        courseCode: req.query.courseCode as string | undefined,
                        status: (req.query.status as string) || "all",
                        page: req.query.page as string | number | undefined,
                        pageSize: req.query.pageSize as
                            | string
                            | number
                            | undefined,
                        sortBy: req.query.sortBy as string | undefined,
                        sortDir: req.query.sortDir as string | undefined,
                    },
                    (apps) => this.attachShortlistFlags(apps)
                );

            if (!result.ok) {
                res.status(result.status).json({
                    success: false,
                    message: result.message,
                });
                return;
            }

            if ("empty" in result && result.empty) {
                res.status(200).json({
                    success: true,
                    data: paginatedResult([], 0, 1, 20),
                    message: result.message,
                });
                return;
            }

            if (!("data" in result)) {
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result.data,
            });
        } catch (error) {
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

            const applicationIds = applications.map((app) => app.id);
            const shortlistedIds = new Set<number>();
            if (applicationIds.length > 0) {
                const shortlistRows = await this.selectedCandidateRepository
                    .createQueryBuilder("selection")
                    .select("selection.applicationId", "applicationId")
                    .where("selection.applicationId IN (:...applicationIds)", {
                        applicationIds,
                    })
                    .getRawMany<{ applicationId: number }>();
                for (const row of shortlistRows) {
                    shortlistedIds.add(Number(row.applicationId));
                }
            }

            const isRanked = (app: Application) =>
                app.rank !== null &&
                app.rank !== undefined &&
                app.rank > 0;

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
                        (app) =>
                            app.status === ApplicationStatus.REJECTED &&
                            !app.isWithdrawn
                    ).length,
                    withdrawn: applications.filter((app) => app.isWithdrawn)
                        .length,
                    ranked: applications.filter(isRanked).length,
                    shortlisted: applications.filter(
                        (app) =>
                            app.status === ApplicationStatus.PENDING &&
                            shortlistedIds.has(app.id) &&
                            !isRanked(app)
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
            const previousStatus = (
                await this.applicationRepository.findOne({
                    where: { id: parseInt(id) },
                    select: ["id", "status"],
                })
            )?.status;

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

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            let updatedApplication: Application;

            if (status === ApplicationStatus.SELECTED) {
                if (application.status === ApplicationStatus.SELECTED) {
                    updatedApplication = application;
                } else {
                    const existingSelection =
                        await this.selectedCandidateRepository.findOne({
                            where: { applicationId: application.id },
                        });

                    if (!existingSelection) {
                        res.status(400).json({
                            success: false,
                            message:
                                "Application must be shortlisted before final selection",
                        });
                        return;
                    }

                    if (
                        !application.rank ||
                        application.rank <= 0 ||
                        !application.rankedForCourse
                    ) {
                        res.status(400).json({
                            success: false,
                            message:
                                "Application must be ranked before final selection",
                        });
                        return;
                    }

                updatedApplication = await AppDataSource.transaction(
                    async (manager) => {
                        const lockedApp = await manager.findOne(Application, {
                            where: { id: application.id },
                            relations: ["course", "role", "candidate"],
                            lock: { mode: "pessimistic_write" },
                        });

                        if (!lockedApp) {
                            throw new Error("APPLICATION_NOT_FOUND");
                        }

                        if (lockedApp.isWithdrawn) {
                            throw new Error("APPLICATION_WITHDRAWN");
                        }

                        const course = await manager.findOne(Course, {
                            where: { id: lockedApp.courseId },
                            lock: { mode: "pessimistic_write" },
                        });

                        if (!course) {
                            throw new Error("COURSE_NOT_FOUND");
                        }

                        const roleName =
                            lockedApp.role.roleName === "tutor"
                                ? "tutor"
                                : "lab_assistant";
                        const selectedCount = await countActiveSelectedForRole(
                            manager,
                            lockedApp.courseId,
                            roleName,
                            lockedApp.id
                        );

                        const maxPositions =
                            roleName === "tutor"
                                ? course.maxTutors
                                : course.maxLabAssistants;

                        if (selectedCount >= maxPositions) {
                            throw new Error(
                                `QUOTA_FULL:${selectedCount}:${maxPositions}`
                            );
                        }

                        lockedApp.status = status;
                        const saved = await manager.save(lockedApp);

                        const existingSelection = await manager.findOne(
                            SelectedCandidate,
                            { where: { applicationId: lockedApp.id } }
                        );

                        if (!existingSelection && lecturerId) {
                            await manager.save(
                                manager.create(SelectedCandidate, {
                                    applicationId: lockedApp.id,
                                    selectedById: lecturerId,
                                })
                            );
                        }

                        return saved;
                    }
                );
                }
            } else {
                application.status = status;

                if (status === ApplicationStatus.REJECTED) {
                    await this.selectedCandidateRepository.delete({
                        applicationId: application.id,
                    });
                    application.rank = null;
                    application.rankedBy = null;
                    application.rankedAt = null;
                    application.rankedForCourse = null;
                }

                updatedApplication = await this.applicationRepository.save(
                    application
                );
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

            void notifyApplicationUpdated(application.id, "status");

            if (lecturerId && previousStatus !== undefined) {
                if (
                    updatedApplication.status === ApplicationStatus.SELECTED &&
                    previousStatus !== ApplicationStatus.SELECTED
                ) {
                    appendDecisionAutoMessage(
                        updatedApplication,
                        lecturerId,
                        "selected"
                    );
                    updatedApplication.offerResponse = OfferResponse.PENDING;
                    updatedApplication.offerRespondedAt = null;
                    updatedApplication =
                        await this.applicationRepository.save(updatedApplication);
                } else if (
                    updatedApplication.status === ApplicationStatus.REJECTED &&
                    previousStatus !== ApplicationStatus.REJECTED
                ) {
                    appendDecisionAutoMessage(
                        updatedApplication,
                        lecturerId,
                        "rejected"
                    );
                    updatedApplication.offerResponse = null;
                    updatedApplication.offerRespondedAt = null;
                    updatedApplication =
                        await this.applicationRepository.save(updatedApplication);
                } else if (
                    updatedApplication.status === ApplicationStatus.PENDING &&
                    previousStatus === ApplicationStatus.SELECTED
                ) {
                    updatedApplication.offerResponse = null;
                    updatedApplication.offerRespondedAt = null;
                    updatedApplication =
                        await this.applicationRepository.save(updatedApplication);
                }
            }

            const responseApplication =
                (await this.loadApplicationForResponse(updatedApplication.id)) ??
                updatedApplication;

            res.status(200).json({
                success: true,
                message: "Application status updated successfully",
                data: responseApplication,
            });
        } catch (error) {
            const code =
                error instanceof Error ? error.message : "UNKNOWN";
            if (code.startsWith("QUOTA_FULL")) {
                const parts = code.split(":");
                const filled = parts[1] ?? "?";
                const max = parts[2] ?? "?";
                res.status(400).json({
                    success: false,
                    message: `All ${max} position slots are already confirmed (${filled}/${max}). Revoke an existing final selection or check Rankings — only confirmed picks use slots, not everyone ranked.`,
                    code: "QUOTA_FULL",
                });
                return;
            }
            if (code === "APPLICATION_WITHDRAWN") {
                res.status(400).json({
                    success: false,
                    message: WITHDRAWN_REAPPLY_MESSAGE,
                    code: "APPLICATION_WITHDRAWN",
                });
                return;
            }
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
                    const selectedTutors = await countActiveSelectedForRole(
                        this.applicationRepository,
                        course.id,
                        "tutor"
                    );

                    const selectedLabAssistants =
                        await countActiveSelectedForRole(
                            this.applicationRepository,
                            course.id,
                            "lab_assistant"
                        );

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
            const { comment, replyToMessageId } = req.body;
            const lecturerId = req.user?.userId;
            if (!lecturerId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

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

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            if (respondIfCandidateBlocked(application, res)) {
                return;
            }

            if (respondIfCorrespondenceInactive(application, res)) {
                return;
            }

            // Append lecturer message to correspondence thread
            const commentText =
                typeof comment === "string" ? comment.trim() : "";
            if (!commentText) {
                res.status(400).json({
                    success: false,
                    message: "Comment cannot be empty",
                });
                return;
            }

            appendLecturerMessage(
                application,
                lecturerId,
                commentText,
                typeof replyToMessageId === "string" ? replyToMessageId : null
            );

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

            void notifyApplicationUpdated(application.id, "comment");

            const responseApplication =
                (await this.loadApplicationForResponse(updatedApplication.id)) ??
                updatedApplication;

            res.status(200).json({
                success: true,
                message: "Comment updated successfully",
                data: responseApplication,
            });
        } catch (error) {
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
            if (!lecturerId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

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

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            if (respondIfCandidateBlocked(application, res)) {
                return;
            }

            clearLecturerCorrespondence(application);

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            void notifyApplicationUpdated(application.id, "comment_removed");

            const responseApplication =
                (await this.loadApplicationForResponse(updatedApplication.id)) ??
                updatedApplication;

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully",
                data: responseApplication,
            });
        } catch (error) {
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

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            // Verify application is shortlisted before ranking
            const isShortlisted = await this.selectedCandidateRepository.findOne(
                {
                    where: { applicationId: application.id },
                }
            );

            if (
                !isShortlisted &&
                application.status !== ApplicationStatus.SELECTED
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        "Application must be shortlisted before adding to ranking",
                });
                return;
            }

            if (application.status === ApplicationStatus.REJECTED) {
                res.status(400).json({
                    success: false,
                    message: "Declined applications cannot be ranked",
                });
                return;
            }

            const resolvedCourseCode = application.course?.courseCode;
            if (
                !resolvedCourseCode ||
                (courseCode && courseCode !== resolvedCourseCode)
            ) {
                res.status(400).json({
                    success: false,
                    message: `Ranking must use the application's course (${resolvedCourseCode})`,
                });
                return;
            }

            application.rank = rank;
            application.rankedBy = lecturerId;
            application.rankedAt = new Date();
            application.rankedForCourse = resolvedCourseCode;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            void notifyApplicationUpdated(application.id, "rank");

            res.status(200).json({
                success: true,
                message: "Application added to ranking successfully",
                data: updatedApplication,
            });
        } catch (error) {
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

            const resolvedCourseCode = application.course?.courseCode;
            if (
                !resolvedCourseCode ||
                (courseCode && courseCode !== resolvedCourseCode)
            ) {
                res.status(400).json({
                    success: false,
                    message: `Ranking must use the application's course (${resolvedCourseCode})`,
                });
                return;
            }

            application.rank = rank;
            application.rankedBy = lecturerId;
            application.rankedAt = new Date();
            application.rankedForCourse = resolvedCourseCode;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            void notifyApplicationUpdated(application.id, "rank");

            res.status(200).json({
                success: true,
                message: "Application ranking updated successfully",
                data: updatedApplication,
            });
        } catch (error) {
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

            void notifyApplicationUpdated(application.id, "rank");

            res.status(200).json({
                success: true,
                message: "Application removed from ranking successfully",
                data: updatedApplication,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async markApplicationReviewed(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const lecturerId = req.user?.userId;
            if (!lecturerId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10) },
                relations: ["course", "role", "candidate"],
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

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            const newlyReviewed = touchApplicationReviewed(
                application,
                lecturerId
            );

            if (newlyReviewed) {
                await this.applicationRepository.save(application);
                void notifyApplicationUpdated(application.id, "reviewed");
            }

            const responseApplication =
                (await this.loadApplicationForResponse(application.id)) ??
                application;

            res.status(200).json({
                success: true,
                message: newlyReviewed
                    ? "Application marked as reviewed"
                    : "Application already reviewed",
                data: responseApplication,
            });
        } catch (error) {
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
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async deleteBlockedApplication(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const lecturerId = req.user?.userId;

            const application = await this.applicationRepository.findOne({
                where: { id: parseInt(id, 10) },
                relations: ["course", "role", "candidate"],
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

            if (!application.candidate?.isBlocked) {
                res.status(400).json({
                    success: false,
                    message:
                        "Only applications from blocked candidates can be removed",
                });
                return;
            }

            await this.applicationRepository.remove(application);

            res.status(200).json({
                success: true,
                message: "Blocked application removed successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async shortlistApplication(
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

            const hasAccess = await this.verifyLecturerCourseAccess(
                lecturerId,
                application.courseId
            );
            if (!hasAccess) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            if (respondIfWithdrawn(application, res)) {
                return;
            }

            if (application.candidate?.isBlocked) {
                res.status(400).json({
                    success: false,
                    message: "Blocked candidates cannot be shortlisted",
                });
                return;
            }

            if (application.status !== ApplicationStatus.PENDING) {
                res.status(400).json({
                    success: false,
                    message:
                        "Only pending applications can be shortlisted at screening",
                });
                return;
            }

            const existingSelection =
                await this.selectedCandidateRepository.findOne({
                    where: { applicationId: application.id },
                });

            if (!existingSelection && lecturerId) {
                await this.selectedCandidateRepository.save(
                    this.selectedCandidateRepository.create({
                        applicationId: application.id,
                        selectedById: lecturerId,
                    })
                );
            }

            const courseCode = application.course?.courseCode;
            const needsRanking =
                courseCode &&
                (application.rank === null ||
                    application.rank === undefined ||
                    application.rank <= 0);

            if (needsRanking && courseCode && lecturerId) {
                const maxRankRow = await this.applicationRepository
                    .createQueryBuilder("application")
                    .select("MAX(application.rank)", "maxRank")
                    .where("application.courseId = :courseId", {
                        courseId: application.courseId,
                    })
                    .andWhere("application.rank > 0")
                    .andWhere("application.rankedForCourse = :courseCode", {
                        courseCode,
                    })
                    .getRawOne<{ maxRank: string | number | null }>();

                application.rank = Number(maxRankRow?.maxRank || 0) + 1;
                application.rankedForCourse = courseCode;
                application.rankedBy = lecturerId;
                application.rankedAt = new Date();
                await this.applicationRepository.save(application);
            }

            const updatedApplication = await this.applicationRepository.findOne({
                where: { id: application.id },
                relations: ["course", "role", "candidate"],
            });

            void notifyApplicationUpdated(application.id, "status");

            res.status(200).json({
                success: true,
                message: needsRanking
                    ? "Application shortlisted and added to ranking"
                    : "Application shortlisted successfully",
                data: {
                    ...updatedApplication,
                    isShortlisted: true,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    async removeShortlist(
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

            const hasAccess = await this.verifyLecturerCourseAccess(
                lecturerId,
                application.courseId
            );
            if (!hasAccess) {
                res.status(403).json({
                    success: false,
                    message: "You don't have access to this application",
                });
                return;
            }

            if (application.status === ApplicationStatus.SELECTED) {
                res.status(400).json({
                    success: false,
                    message:
                        "Revoke final selection before removing this shortlist",
                });
                return;
            }

            await this.selectedCandidateRepository.delete({
                applicationId: application.id,
            });

            application.rank = null;
            application.rankedBy = null;
            application.rankedAt = null;
            application.rankedForCourse = null;

            const updatedApplication = await this.applicationRepository.save(
                application
            );

            void notifyApplicationUpdated(application.id, "status");

            res.status(200).json({
                success: true,
                message: "Application removed from shortlist",
                data: {
                    ...updatedApplication,
                    isShortlisted: false,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}
