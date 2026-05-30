import type { ApplicationResponse } from "@/shared/services/applicationService";

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
      editedAt: typeof row.editedAt === "string" ? row.editedAt : null,
      replyToMessageId:
        typeof row.replyToMessageId === "string" && row.replyToMessageId.trim()
          ? row.replyToMessageId.trim()
          : null,
    });
  }
  return out.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function buildFromLegacy(application: ApplicationResponse): CorrespondenceMessage[] {
  const messages: CorrespondenceMessage[] = [];

  if (application.comment?.trim()) {
    messages.push({
      id: "msg-lecturer-primary",
      authorRole: "lecturer",
      authorId: application.commentedBy ?? 0,
      body: application.comment.trim(),
      createdAt: application.commentedAt ?? application.updatedAt,
    });
  }

  if (application.candidateResponse?.trim()) {
    messages.push({
      id: "msg-candidate-legacy",
      authorRole: "candidate",
      authorId: application.candidate?.id ?? application.candidateId,
      body: application.candidateResponse.trim(),
      createdAt:
        application.candidateRespondedAt ?? application.updatedAt,
    });
  }

  return messages.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getCorrespondenceMessages(
  application: ApplicationResponse
): CorrespondenceMessage[] {
  const stored = parseCorrespondenceMessages(
    application.correspondenceMessages
  );
  if (stored.length > 0) return stored;
  return buildFromLegacy(application);
}

export function canEditCandidateMessage(message: CorrespondenceMessage): boolean {
  if (message.authorRole !== "candidate") return false;
  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  return ageMs <= CANDIDATE_EDIT_WINDOW_MS;
}
