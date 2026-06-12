import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { Notification } from "../entities/Notification";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { parseCorrespondenceMessages } from "./correspondenceMessages";

function shiftDate(
    value: Date | string | null | undefined,
    shiftMs: number
): Date | null | undefined {
    if (!value) return value ?? null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return value instanceof Date ? value : null;
    return new Date(date.getTime() + shiftMs);
}

function shiftIso(
    value: string | null | undefined,
    shiftMs: number
): string | null | undefined {
    if (!value) return value ?? null;
    const shifted = shiftDate(value, shiftMs);
    return shifted instanceof Date ? shifted.toISOString() : null;
}

async function findLatestTimestamp(): Promise<Date> {
    const candidates: Date[] = [new Date(0)];

    const userLatest = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .select("MAX(user.updatedAt)", "max")
        .getRawOne<{ max: Date | null }>();
    if (userLatest?.max) candidates.push(new Date(userLatest.max));

    const courseLatest = await AppDataSource.getRepository(Course)
        .createQueryBuilder("course")
        .select("MAX(course.updatedAt)", "max")
        .getRawOne<{ max: Date | null }>();
    if (courseLatest?.max) candidates.push(new Date(courseLatest.max));

    const applicationLatest = await AppDataSource.getRepository(Application)
        .createQueryBuilder("application")
        .select("MAX(application.updatedAt)", "max")
        .getRawOne<{ max: Date | null }>();
    if (applicationLatest?.max) {
        candidates.push(new Date(applicationLatest.max));
    }

    const notificationLatest = await AppDataSource.getRepository(Notification)
        .createQueryBuilder("notification")
        .select("MAX(notification.createdAt)", "max")
        .getRawOne<{ max: Date | null }>();
    if (notificationLatest?.max) {
        candidates.push(new Date(notificationLatest.max));
    }

    return candidates.reduce(
        (latest, current) =>
            current.getTime() > latest.getTime() ? current : latest,
        new Date(0)
    );
}

/**
 * Shift all demo timestamps forward so the newest record is close to now.
 * Preserves relative spacing between applications, chats, and notifications.
 */
export async function refreshDemoTimestamps(): Promise<{
    shiftMs: number;
    anchorBefore: string;
    anchorAfter: string;
}> {
    const latest = await findLatestTimestamp();
    const target = new Date();
    const shiftMs = target.getTime() - latest.getTime();

    if (Math.abs(shiftMs) < 60_000) {
        return {
            shiftMs: 0,
            anchorBefore: latest.toISOString(),
            anchorAfter: latest.toISOString(),
        };
    }

    const userRepo = AppDataSource.getRepository(User);
    for (const user of await userRepo.find()) {
        user.createdAt = shiftDate(user.createdAt, shiftMs) as Date;
        user.updatedAt = shiftDate(user.updatedAt, shiftMs) as Date;
        if (user.deletedAt) {
            user.deletedAt = shiftDate(user.deletedAt, shiftMs) as Date;
        }
        await userRepo.save(user);
    }

    const courseRepo = AppDataSource.getRepository(Course);
    for (const course of await courseRepo.find()) {
        course.createdAt = shiftDate(course.createdAt, shiftMs) as Date;
        course.updatedAt = shiftDate(course.updatedAt, shiftMs) as Date;
        course.applicationDeadline = shiftDate(
            course.applicationDeadline,
            shiftMs
        ) as Date | null;
        await courseRepo.save(course);
    }

    const assignmentRepo = AppDataSource.getRepository(CourseAssignment);
    for (const assignment of await assignmentRepo.find()) {
        assignment.assignedAt = shiftDate(assignment.assignedAt, shiftMs) as Date;
        await assignmentRepo.save(assignment);
    }

    const applicationRepo = AppDataSource.getRepository(Application);
    for (const application of await applicationRepo.find()) {
        application.appliedAt = shiftDate(application.appliedAt, shiftMs) as Date;
        application.updatedAt = shiftDate(application.updatedAt, shiftMs) as Date;
        application.candidateRespondedAt = shiftDate(
            application.candidateRespondedAt,
            shiftMs
        ) as Date | null;
        application.withdrawnAt = shiftDate(
            application.withdrawnAt,
            shiftMs
        ) as Date | null;
        application.commentedAt = shiftDate(
            application.commentedAt,
            shiftMs
        ) as Date | undefined;
        application.rankedAt = shiftDate(application.rankedAt, shiftMs) as
            | Date
            | null;
        application.offerRespondedAt = shiftDate(
            application.offerRespondedAt,
            shiftMs
        ) as Date | null;
        application.reviewedAt = shiftDate(application.reviewedAt, shiftMs) as
            | Date
            | null;

        const messages = parseCorrespondenceMessages(
            application.correspondenceMessages
        ).map((message) => ({
            ...message,
            createdAt: shiftIso(message.createdAt, shiftMs) ?? message.createdAt,
            editedAt: shiftIso(message.editedAt, shiftMs),
            deletedAt: shiftIso(message.deletedAt, shiftMs),
        }));
        application.correspondenceMessages =
            messages.length > 0 ? messages : application.correspondenceMessages;

        await applicationRepo.save(application);
    }

    const selectedRepo = AppDataSource.getRepository(SelectedCandidate);
    for (const row of await selectedRepo.find()) {
        row.selectedAt = shiftDate(row.selectedAt, shiftMs) as Date;
        await selectedRepo.save(row);
    }

    const notificationRepo = AppDataSource.getRepository(Notification);
    for (const notification of await notificationRepo.find()) {
        notification.createdAt = shiftDate(
            notification.createdAt,
            shiftMs
        ) as Date;
        await notificationRepo.save(notification);
    }

    const draftRepo = AppDataSource.getRepository(ApplicationDraft);
    for (const draft of await draftRepo.find()) {
        draft.createdAt = shiftDate(draft.createdAt, shiftMs) as Date;
        draft.updatedAt = shiftDate(draft.updatedAt, shiftMs) as Date;
        await draftRepo.save(draft);
    }

    return {
        shiftMs,
        anchorBefore: latest.toISOString(),
        anchorAfter: new Date(latest.getTime() + shiftMs).toISOString(),
    };
}
