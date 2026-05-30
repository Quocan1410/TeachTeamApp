import { randomUUID } from "crypto";
import type { Application } from "../entities/Application";

export type CorrespondenceAuthorRole = "candidate" | "lecturer";

export interface CorrespondenceMessage {
    id: string;
    authorRole: CorrespondenceAuthorRole;
    authorId: number;
    body: string;
    createdAt: string;
    editedAt?: string | null;
    replyToMessageId?: string | null;
}

export const LECTURER_PRIMARY_MESSAGE_ID = "msg-lecturer-primary";

export const CANDIDATE_EDIT_WINDOW_MS = 2 * 60 * 1000;

export function parseCorrespondenceMessages(
    raw: unknown
): CorrespondenceMessage[] {
    if (!Array.isArray(raw)) return [];
    const out: CorrespondenceMessage[] = [];
    for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        const id = typeof row.id === "string" ? row.id.trim() : "";
        const authorRole = row.authorRole;
        const authorId = Number(row.authorId);
        const body = typeof row.body === "string" ? row.body.trim() : "";
        const createdAt =
            typeof row.createdAt === "string" ? row.createdAt : "";
        if (
            !id ||
            !body ||
            !createdAt ||
            !Number.isInteger(authorId) ||
            authorId <= 0 ||
            (authorRole !== "candidate" && authorRole !== "lecturer")
        ) {
            continue;
        }
        out.push({
            id,
            authorRole,
            authorId,
            body,
            createdAt,
            editedAt:
                typeof row.editedAt === "string" ? row.editedAt : null,
            replyToMessageId:
                typeof row.replyToMessageId === "string" &&
                row.replyToMessageId.trim()
                    ? row.replyToMessageId.trim()
                    : null,
        });
    }
    return out.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function buildCorrespondenceFromLegacy(
    application: Application
): CorrespondenceMessage[] {
    const messages: CorrespondenceMessage[] = [];

    if (application.comment?.trim()) {
        messages.push({
            id: LECTURER_PRIMARY_MESSAGE_ID,
            authorRole: "lecturer",
            authorId: application.commentedBy ?? 0,
            body: application.comment.trim(),
            createdAt: (
                application.commentedAt ?? application.updatedAt
            ).toISOString(),
        });
    }

    if (application.candidateResponse?.trim()) {
        messages.push({
            id: "msg-candidate-legacy",
            authorRole: "candidate",
            authorId: application.candidateId,
            body: application.candidateResponse.trim(),
            createdAt: (
                application.candidateRespondedAt ?? application.updatedAt
            ).toISOString(),
        });
    }

    return messages.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getCorrespondenceMessages(
    application: Application
): CorrespondenceMessage[] {
    const stored = parseCorrespondenceMessages(
        application.correspondenceMessages
    );
    if (stored.length > 0) return stored;
    return buildCorrespondenceFromLegacy(application);
}

export function syncLegacyCorrespondenceFields(
    application: Application,
    messages: CorrespondenceMessage[]
): void {
    const lecturerMsgs = messages.filter((m) => m.authorRole === "lecturer");
    const latestLecturer = lecturerMsgs[lecturerMsgs.length - 1];
    if (latestLecturer) {
        application.comment = latestLecturer.body;
        application.commentedBy = latestLecturer.authorId || undefined;
        application.commentedAt = new Date(latestLecturer.createdAt);
    } else {
        application.comment = "";
        application.commentedBy = undefined;
        application.commentedAt = undefined;
    }

    const candidateMsgs = messages.filter((m) => m.authorRole === "candidate");
    const latestCandidate = candidateMsgs[candidateMsgs.length - 1];
    if (latestCandidate) {
        application.candidateResponse = latestCandidate.body;
        application.candidateRespondedAt = new Date(latestCandidate.createdAt);
    } else {
        application.candidateResponse = null;
        application.candidateRespondedAt = null;
    }

    application.correspondenceMessages = messages;
}

export function correspondenceMessageExists(
    application: Application,
    messageId: string
): boolean {
    return getCorrespondenceMessages(application).some((m) => m.id === messageId);
}

function resolveReplyToMessageId(
    application: Application,
    replyToMessageId?: string | null
): string | null {
    const trimmed =
        typeof replyToMessageId === "string" ? replyToMessageId.trim() : "";
    if (!trimmed) return null;
    if (!correspondenceMessageExists(application, trimmed)) return null;
    return trimmed;
}

export function appendCandidateMessage(
    application: Application,
    candidateId: number,
    body: string,
    replyToMessageId?: string | null
): CorrespondenceMessage {
    const messages = getCorrespondenceMessages(application);
    const message: CorrespondenceMessage = {
        id: `msg-${randomUUID()}`,
        authorRole: "candidate",
        authorId: candidateId,
        body,
        createdAt: new Date().toISOString(),
        replyToMessageId: resolveReplyToMessageId(application, replyToMessageId),
    };
    messages.push(message);
    syncLegacyCorrespondenceFields(application, messages);
    return message;
}

export function appendLecturerMessage(
    application: Application,
    lecturerId: number,
    body: string,
    replyToMessageId?: string | null
): CorrespondenceMessage {
    const messages = getCorrespondenceMessages(application);
    const message: CorrespondenceMessage = {
        id: `msg-${randomUUID()}`,
        authorRole: "lecturer",
        authorId: lecturerId,
        body,
        createdAt: new Date().toISOString(),
        replyToMessageId: resolveReplyToMessageId(application, replyToMessageId),
    };
    messages.push(message);
    syncLegacyCorrespondenceFields(application, messages);
    return message;
}

export function syncLecturerCommentMessage(
    application: Application,
    lecturerId: number,
    comment: string
): void {
    const messages = getCorrespondenceMessages(application);
    const trimmed = comment.trim();
    const existingIdx = messages.findIndex(
        (m) => m.id === LECTURER_PRIMARY_MESSAGE_ID
    );

    if (!trimmed) {
        const next = messages.filter(
            (m) => m.id !== LECTURER_PRIMARY_MESSAGE_ID
        );
        syncLegacyCorrespondenceFields(application, next);
        return;
    }

    if (existingIdx >= 0) {
        messages[existingIdx] = {
            ...messages[existingIdx],
            body: trimmed,
            authorId: lecturerId,
            editedAt: new Date().toISOString(),
        };
    } else {
        messages.push({
            id: LECTURER_PRIMARY_MESSAGE_ID,
            authorRole: "lecturer",
            authorId: lecturerId,
            body: trimmed,
            createdAt: new Date().toISOString(),
        });
    }

    syncLegacyCorrespondenceFields(application, messages);
}

export function updateCandidateMessage(
    application: Application,
    candidateId: number,
    messageId: string,
    body: string
): CorrespondenceMessage | null {
    const messages = getCorrespondenceMessages(application);
    const index = messages.findIndex((m) => m.id === messageId);
    if (index < 0) return null;

    const message = messages[index];
    if (message.authorRole !== "candidate" || message.authorId !== candidateId) {
        return null;
    }

    const ageMs = Date.now() - new Date(message.createdAt).getTime();
    if (ageMs > CANDIDATE_EDIT_WINDOW_MS) {
        return null;
    }

    messages[index] = {
        ...message,
        body,
        editedAt: new Date().toISOString(),
    };
    syncLegacyCorrespondenceFields(application, messages);
    return messages[index];
}

export function deleteCorrespondenceMessage(
    application: Application,
    candidateId: number,
    messageId: string
): boolean {
    const messages = getCorrespondenceMessages(application);
    const target = messages.find((m) => m.id === messageId);
    if (!target) return false;
    if (target.authorRole !== "candidate" || target.authorId !== candidateId) {
        return false;
    }

    const next = messages.filter((m) => m.id !== messageId);

    if (application.messageReactions?.[messageId]) {
        const reactions = { ...application.messageReactions };
        delete reactions[messageId];
        application.messageReactions =
            Object.keys(reactions).length > 0 ? reactions : null;
    }

    syncLegacyCorrespondenceFields(application, next);
    return true;
}

export function canCandidateEditMessage(message: CorrespondenceMessage): boolean {
    if (message.authorRole !== "candidate") return false;
    const ageMs = Date.now() - new Date(message.createdAt).getTime();
    return ageMs <= CANDIDATE_EDIT_WINDOW_MS;
}
