import type { ApplicationResponse } from "@/shared/services/applicationService";
import type { ApplicationTimelineItem } from "@/shared/utils/applicationTimeline";
import { CANDIDATE_EDIT_WINDOW_MS } from "@/shared/utils/correspondenceMessages";
import { getCourseLecturerPlainName } from "@/shared/utils/courseLecturer";
import {
  formatCandidateDisplayName,
  formatHonorificName,
  formatLecturerDisplayName,
  inferHonorific,
  joinPersonName,
  splitDisplayName,
  type Honorific,
} from "@/shared/utils/personDisplayName";
import {
  dateKey,
  formatConversationTimestamp,
  formatDateDivider,
} from "@/shared/utils/vietnamTime";

export {
  formatConversationTimestamp,
  formatDateDivider,
  dateKey,
  inferHonorific,
  formatHonorificName,
  type Honorific,
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getCandidateDisplayName(
  application: ApplicationResponse,
  fallback = "Applicant"
): string {
  const candidate = application.candidate;
  if (!candidate) return fallback;
    return joinPersonName(
    {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      userType: "candidate",
      honorific: candidate.honorific,
    },
    fallback
  );
}

export function getCandidateFormattedName(
  application: ApplicationResponse,
  authUser?: (AvatarPerson & { id?: number }) | null
): string {
  return formatCandidateDisplayName(
    getCandidateAvatarPerson(application, authUser),
    getCandidateDisplayName(application)
  );
}

export function getLecturerFormattedName(
  application: ApplicationResponse
): string {
  const fromComment = application.commentedByUser;
  if (fromComment) {
    return formatLecturerDisplayName(
      {
        firstName: fromComment.firstName,
        lastName: fromComment.lastName,
        email: fromComment.email,
        userType: "lecturer",
        honorific: fromComment.honorific,
      },
      getLecturerDisplayName(application)
    );
  }

  const lecturer = getLecturerAvatarPerson(application);
  if (lecturer) {
    return formatLecturerDisplayName(
      lecturer,
      getLecturerDisplayName(application)
    );
  }

  return formatLecturerDisplayName(
    { userType: "lecturer" },
    getLecturerDisplayName(application)
  );
}

export function getLecturerDisplayName(application: ApplicationResponse): string {
  const fromComment = application.commentedByUser;
  if (fromComment) {
    const name = joinPersonName(fromComment);
    if (name) return name;
  }
  return getCourseLecturerPlainName(application.course) ?? "Course lecturer";
}

export type AvatarPerson = {
  userId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: string;
  honorific?: string | null;
  avatarUrl?: string | null;
};

export function getCandidateAvatarPerson(
  application: ApplicationResponse,
  authUser?: (AvatarPerson & { id?: number }) | null
): AvatarPerson {
  if (authUser?.email) {
    return {
      userId: authUser.userId ?? authUser.id ?? application.candidateId,
      firstName: authUser.firstName ?? application.candidate?.firstName,
      lastName: authUser.lastName ?? application.candidate?.lastName,
      email: authUser.email,
      userType: authUser.userType ?? "candidate",
      honorific: authUser.honorific ?? application.candidate?.honorific,
      avatarUrl: authUser.avatarUrl ?? application.candidate?.avatarUrl,
    };
  }
  const candidate = application.candidate;
  return {
    userId: candidate?.id ?? application.candidateId,
    firstName: candidate?.firstName,
    lastName: candidate?.lastName,
    email: candidate?.email,
    userType: "candidate",
    honorific: candidate?.honorific,
    avatarUrl: candidate?.avatarUrl,
  };
}

export function getLecturerAvatarPerson(
  application: ApplicationResponse
): AvatarPerson | null {
  const fromComment = application.commentedByUser;
  if (fromComment?.email) {
    return {
      userId: fromComment.id,
      firstName: fromComment.firstName,
      lastName: fromComment.lastName,
      email: fromComment.email,
      userType: "lecturer",
      honorific: fromComment.honorific,
      avatarUrl: fromComment.avatarUrl,
    };
  }

  const course = application.course as ApplicationResponse["course"] & {
    courseAssignments?: Array<{
      lecturer?: {
        id?: number;
        firstName?: string;
        lastName?: string;
        email?: string;
        honorific?: string | null;
        avatarUrl?: string | null;
      };
    }>;
  };
  const lecturer = course.courseAssignments?.[0]?.lecturer;
  if (!lecturer?.email) return null;

  return {
    userId: lecturer.id,
    firstName: lecturer.firstName,
    lastName: lecturer.lastName,
    email: lecturer.email,
    userType: "lecturer",
    honorific: lecturer.honorific,
    avatarUrl: lecturer.avatarUrl,
  };
}

export function getPersonInitials(person: AvatarPerson): string {
  const first = person.firstName?.trim() ?? "";
  const last = person.lastName?.trim() ?? "";
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  const fullName = `${first} ${last}`.trim() || first || last;
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }
  const email = person.email?.trim() ?? "";
  if (email.length >= 2) {
    return email.slice(0, 2).toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

export type ThreadEntry =
  | { type: "date"; id: string; label: string }
  | { type: "message"; item: ApplicationTimelineItem };

export interface ReplyQuotePreview {
  senderName: string;
  body: string;
  messageId: string;
}

export function correspondenceMessageAnchorId(messageId: string): string {
  return `correspondence-message-${messageId}`;
}

export function scrollToCorrespondenceMessage(messageId: string): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(correspondenceMessageAnchorId(messageId));
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("correspondenceMessageJumpTarget");
  window.setTimeout(() => {
    el.classList.remove("correspondenceMessageJumpTarget");
  }, 1400);
  return true;
}

const REPLY_QUOTE_BODY_MAX = 160;

function truncateReplyQuoteBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= REPLY_QUOTE_BODY_MAX) return trimmed;
  return `${trimmed.slice(0, REPLY_QUOTE_BODY_MAX).trimEnd()}…`;
}

function replyQuoteSenderLabel(
  referenced: ApplicationTimelineItem,
  application: ApplicationResponse,
  authUser?: (AvatarPerson & { id?: number }) | null
): string {
  const full =
    referenced.kind === "lecturer"
      ? getLecturerFormattedName(application)
      : getCandidateFormattedName(application, authUser);
  const { leading, rest } = splitDisplayName(full);
  const firstName = rest.split(/\s+/).filter(Boolean)[0] ?? rest;
  if (leading && firstName) {
    return `${leading} ${firstName}`;
  }
  return full;
}

export function resolveReplyQuote(
  item: ApplicationTimelineItem,
  itemsById: Map<string, ApplicationTimelineItem>,
  application: ApplicationResponse,
  authUser?: (AvatarPerson & { id?: number }) | null
): ReplyQuotePreview | null {
  const replyId = item.replyToMessageId?.trim();
  if (!replyId) return null;

  const referenced = itemsById.get(replyId);
  if (!referenced?.body?.trim()) return null;

  return {
    senderName: replyQuoteSenderLabel(referenced, application, authUser),
    body: truncateReplyQuoteBody(referenced.body),
    messageId: replyId,
  };
}

export function buildThreadEntries(
  items: ApplicationTimelineItem[],
  options?: { skipInitialDateKey?: string }
): ThreadEntry[] {
  const entries: ThreadEntry[] = [];
  let lastDateKey: string | null = null;
  let skippedInitialDate = false;

  for (const item of items) {
    const key = dateKey(item.at);
    if (key !== lastDateKey) {
      const skipDuplicateSubmissionDate =
        !skippedInitialDate &&
        options?.skipInitialDateKey &&
        key === options.skipInitialDateKey &&
        entries.length === 0;

      if (!skipDuplicateSubmissionDate) {
        entries.push({
          type: "date",
          id: `date-${key}`,
          label: formatDateDivider(item.at),
        });
      } else {
        skippedInitialDate = true;
      }
      lastDateKey = key;
    }
    entries.push({ type: "message", item });
  }

  return entries;
}

export function canEditTimelineMessage(
  item: ApplicationTimelineItem
): boolean {
  if (item.kind !== "candidate") return false;
  const ageMs = Date.now() - new Date(item.at).getTime();
  return ageMs <= CANDIDATE_EDIT_WINDOW_MS;
}

export function isChatMessage(item: ApplicationTimelineItem): boolean {
  return item.kind === "lecturer" || item.kind === "candidate";
}
