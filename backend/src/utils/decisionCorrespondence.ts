import type { Application } from "../entities/Application";
import {
    getCorrespondenceMessages,
    syncLegacyCorrespondenceFields,
} from "./correspondenceMessages";
import { touchApplicationReviewed } from "./applicationReview";

export const AUTO_SELECTED_MESSAGE_ID = "msg-auto-decision-selected";
export const AUTO_REJECTED_MESSAGE_ID = "msg-auto-decision-rejected";

function roleLabel(application: Application): string {
    return application.role?.roleName === "lab_assistant"
        ? "Lab Assistant"
        : "Tutor";
}

export function buildSelectionAutoMessage(application: Application): string {
    const courseCode = application.course?.courseCode ?? "this course";
    return (
        `Congratulations! You have been selected for the ${roleLabel(application)} ` +
        `role in ${courseCode}. Please confirm whether you accept this offer and share ` +
        `any message with us in your reply. We look forward to hearing from you.`
    );
}

export function buildRejectionAutoMessage(application: Application): string {
    const courseCode = application.course?.courseCode ?? "this course";
    return (
        `Thank you for applying for the ${roleLabel(application)} role in ${courseCode}. ` +
        `After careful review, we will not be moving forward with your application at this time. ` +
        `We appreciate your interest and wish you all the best.`
    );
}

export function appendDecisionAutoMessage(
    application: Application,
    lecturerId: number,
    decision: "selected" | "rejected"
): boolean {
    const messageId =
        decision === "selected"
            ? AUTO_SELECTED_MESSAGE_ID
            : AUTO_REJECTED_MESSAGE_ID;

    const messages = getCorrespondenceMessages(application);
    if (messages.some((message) => message.id === messageId)) {
        return false;
    }

    const body =
        decision === "selected"
            ? buildSelectionAutoMessage(application)
            : buildRejectionAutoMessage(application);

    syncLegacyCorrespondenceFields(application, [
        ...messages,
        {
            id: messageId,
            authorRole: "lecturer",
            authorId: lecturerId,
            body,
            createdAt: new Date().toISOString(),
        },
    ]);
    touchApplicationReviewed(application, lecturerId);

    return true;
}
