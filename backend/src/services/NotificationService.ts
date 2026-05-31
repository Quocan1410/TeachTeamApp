import { AppDataSource } from "../config/database";
import { Notification, NotificationType } from "../entities/Notification";
import { User, UserType } from "../entities/User";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application, ApplicationStatus } from "../entities/Application";

export interface CreateNotificationInput {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
}

export class NotificationService {
    private static getRepository() {
        if (!AppDataSource.isInitialized) {
            throw new Error("Database not initialized");
        }
        return AppDataSource.getRepository(Notification);
    }

    private static async hasNotificationForApplication(
        userId: number,
        type: NotificationType,
        applicationId: number
    ): Promise<boolean> {
        const rows = await this.getRepository().find({
            where: { userId, type },
            select: ["id", "metadata"],
            take: 200,
        });

        return rows.some(
            (row) =>
                typeof row.metadata?.applicationId === "number" &&
                row.metadata.applicationId === applicationId
        );
    }

    private static async ensureNotification(
        input: CreateNotificationInput
    ): Promise<boolean> {
        const applicationId = input.metadata?.applicationId;
        if (typeof applicationId === "number") {
            const exists = await this.hasNotificationForApplication(
                input.userId,
                input.type,
                applicationId
            );
            if (exists) {
                return false;
            }
        }

        await this.create(input);
        return true;
    }

    /**
     * Rebuild missing notifications from persisted applications.
     * Safe to run after the notifications table was recreated or when seed data is incomplete.
     */
    static async backfillFromApplications(): Promise<number> {
        const applicationRepo = AppDataSource.getRepository(Application);
        const assignmentRepo = AppDataSource.getRepository(CourseAssignment);

        const applications = await applicationRepo.find({
            relations: ["course", "role", "candidate"],
        });

        let created = 0;

        for (const application of applications) {
            if (!application.course || !application.role || !application.candidate) {
                continue;
            }

            const candidateName =
                `${application.candidate.firstName} ${application.candidate.lastName}`.trim();
            const metadata = {
                courseId: application.courseId,
                candidateId: application.candidateId,
                applicationId: application.id,
            };

            const assignments = await assignmentRepo.find({
                where: { courseId: application.courseId },
                select: ["lecturerId"],
            });

            if (!application.isWithdrawn) {
                for (const assignment of assignments) {
                    if (
                        await this.ensureNotification({
                            userId: assignment.lecturerId,
                            type: NotificationType.APPLICATION_SUBMITTED,
                            title: "New application",
                            message: `${candidateName} applied for ${application.role.roleName} in ${application.course.courseCode}.`,
                            link: "/lecturer",
                            metadata,
                        })
                    ) {
                        created += 1;
                    }

                    const hasCandidateReply =
                        application.correspondenceMessages?.some(
                            (message) => message.authorRole === "candidate"
                        ) ||
                        Boolean(application.candidateResponse?.trim());

                    if (hasCandidateReply) {
                        if (
                            await this.ensureNotification({
                                userId: assignment.lecturerId,
                                type: NotificationType.APPLICATION_RESPONSE,
                                title: "Candidate replied",
                                message: `${application.candidate.firstName} sent additional details for ${application.course.courseCode}.`,
                                link: "/lecturer",
                                metadata,
                            })
                        ) {
                            created += 1;
                        }
                    }
                }
            } else {
                for (const assignment of assignments) {
                    if (
                        await this.ensureNotification({
                            userId: assignment.lecturerId,
                            type: NotificationType.APPLICATION_WITHDRAWN,
                            title: "Application withdrawn",
                            message: `${candidateName} withdrew ${application.role.roleName} application in ${application.course.courseCode}.`,
                            link: "/lecturer",
                            metadata,
                        })
                    ) {
                        created += 1;
                    }
                }
            }

            const hasLecturerFeedback =
                Boolean(application.comment?.trim()) ||
                application.correspondenceMessages?.some(
                    (message) => message.authorRole === "lecturer"
                );

            if (hasLecturerFeedback) {
                if (
                    await this.ensureNotification({
                        userId: application.candidateId,
                        type: NotificationType.APPLICATION_COMMENT,
                        title: "New feedback on your application",
                        message: `A lecturer left feedback on your ${application.role.roleName} application for ${application.course.courseCode}.`,
                        link: "/tutor",
                        metadata,
                    })
                ) {
                    created += 1;
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
                    message: `You were selected for ${application.role.roleName} in ${application.course.courseCode}.`,
                },
                [ApplicationStatus.REJECTED]: {
                    type: NotificationType.APPLICATION_REJECTED,
                    title: "Application update",
                    message: `Your application for ${application.role.roleName} in ${application.course.courseCode} was not selected.`,
                },
            };

            const statusNotification =
                statusNotificationMap[application.status as ApplicationStatus];
            if (statusNotification && !application.isWithdrawn) {
                if (
                    await this.ensureNotification({
                        userId: application.candidateId,
                        type: statusNotification.type,
                        title: statusNotification.title,
                        message: statusNotification.message,
                        link: "/tutor",
                        metadata: {
                            ...metadata,
                            status: application.status,
                        },
                    })
                ) {
                    created += 1;
                }
            }
        }

        return created;
    }

    static async create(input: CreateNotificationInput): Promise<Notification> {
        const repo = this.getRepository();
        const notification = repo.create({
            ...input,
            read: false,
        });
        return repo.save(notification);
    }

    static async createForUsers(
        userIds: number[],
        input: Omit<CreateNotificationInput, "userId">
    ): Promise<void> {
        const uniqueIds = [...new Set(userIds.filter((id) => id > 0))];
        if (uniqueIds.length === 0) return;

        await Promise.all(
            uniqueIds.map((userId) =>
                this.create({
                    userId,
                    ...input,
                })
            )
        );
    }

    static async notifyAdmins(
        input: Omit<CreateNotificationInput, "userId">
    ): Promise<void> {
        const userRepo = AppDataSource.getRepository(User);
        const admins = await userRepo.find({
            where: { userType: UserType.ADMIN },
            select: ["id"],
        });
        await this.createForUsers(
            admins.map((a) => a.id),
            input
        );
    }

    static async notifyLecturersForCourse(
        courseId: number,
        input: Omit<CreateNotificationInput, "userId">
    ): Promise<void> {
        const assignmentRepo = AppDataSource.getRepository(CourseAssignment);
        const assignments = await assignmentRepo.find({
            where: { courseId },
            select: ["lecturerId"],
        });
        await this.createForUsers(
            assignments.map((a) => a.lecturerId),
            input
        );
    }

    static async getForUser(
        userId: number,
        limit = 50
    ): Promise<Notification[]> {
        return this.getRepository().find({
            where: { userId },
            order: { createdAt: "DESC" },
            take: limit,
        });
    }

    static async getUnreadCount(userId: number): Promise<number> {
        return this.getRepository().count({
            where: { userId, read: false },
        });
    }

    static async markAsRead(
        notificationId: number,
        userId: number
    ): Promise<boolean> {
        const result = await this.getRepository().update(
            { id: notificationId, userId },
            { read: true }
        );
        return (result.affected ?? 0) > 0;
    }

    static async markAllAsRead(userId: number): Promise<void> {
        await this.getRepository().update({ userId, read: false }, { read: true });
    }

    static async deleteNotification(
        notificationId: number,
        userId: number
    ): Promise<boolean> {
        const result = await this.getRepository().delete({
            id: notificationId,
            userId,
        });
        return (result.affected ?? 0) > 0;
    }
}
