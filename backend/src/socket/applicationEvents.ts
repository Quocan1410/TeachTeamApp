import { AppDataSource } from "../config/database";
import { Application } from "../entities/Application";
import { CourseAssignment } from "../entities/CourseAssignment";
import { emitToUser } from "./socketServer";

export const APPLICATION_UPDATED_EVENT = "application:updated";

export type ApplicationUpdateReason =
    | "created"
    | "candidate_response"
    | "offer_response"
    | "withdrawn"
    | "status"
    | "comment"
    | "comment_removed"
    | "rank"
    | "reaction"
    | "reviewed";

export type ApplicationUpdatedPayload = {
    reason: ApplicationUpdateReason;
    application: Record<string, unknown>;
};

const APPLICATION_RELATIONS = [
    "course",
    "course.courseAssignments",
    "course.courseAssignments.lecturer",
    "role",
] as const;

const serializeApplication = (application: Application): Record<string, unknown> =>
    JSON.parse(JSON.stringify(application)) as Record<string, unknown>;

export async function notifyApplicationUpdated(
    applicationId: number,
    reason: ApplicationUpdateReason
): Promise<void> {
    try {
        const applicationRepository = AppDataSource.getRepository(Application);
        const assignmentRepository =
            AppDataSource.getRepository(CourseAssignment);

        const application = await applicationRepository.findOne({
            where: { id: applicationId },
            relations: [...APPLICATION_RELATIONS],
        });

        if (!application) {
            return;
        }

        const payload: ApplicationUpdatedPayload = {
            reason,
            application: serializeApplication(application),
        };

        emitToUser(application.candidateId, APPLICATION_UPDATED_EVENT, payload);

        const assignments = await assignmentRepository.find({
            where: { courseId: application.courseId },
            select: ["lecturerId"],
        });

        const lecturerIds = new Set(
            assignments.map((assignment) => assignment.lecturerId)
        );

        lecturerIds.forEach((lecturerId) => {
            emitToUser(lecturerId, APPLICATION_UPDATED_EVENT, payload);
        });
    } catch (error) {
        console.error("Failed to emit application:updated:", error);
    }
}
