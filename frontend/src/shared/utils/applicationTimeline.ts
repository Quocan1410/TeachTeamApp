import type { ApplicationResponse } from "@/shared/services/applicationService";
import { getCorrespondenceMessages } from "./correspondenceMessages";

export type TimelineKind = "system" | "lecturer" | "candidate";

export interface ApplicationTimelineItem {
  id: string;
  kind: TimelineKind;
  title: string;
  body?: string;
  at: string;
  editedAt?: string | null;
  replyToMessageId?: string | null;
}

export function buildApplicationTimeline(
  application: ApplicationResponse
): ApplicationTimelineItem[] {
  const items: ApplicationTimelineItem[] = [
    {
      id: "submitted",
      kind: "system",
      title: "Application submitted",
      body: "Your application was received and is part of the official record for this course.",
      at: application.appliedAt,
    },
  ];

  for (const message of getCorrespondenceMessages(application)) {
    items.push({
      id: message.id,
      kind: message.authorRole === "lecturer" ? "lecturer" : "candidate",
      title:
        message.authorRole === "lecturer"
          ? "Lecturer message"
          : "Your message",
      body: message.body,
      at: message.createdAt,
      editedAt: message.editedAt,
      replyToMessageId: message.replyToMessageId ?? null,
    });
  }

  if (application.status === "selected") {
    items.push({
      id: "decision-selected",
      kind: "system",
      title: "Final decision: Selected",
      body: "The lecturer recorded a positive outcome for this application.",
      at: application.updatedAt,
    });
  }

  if (application.status === "rejected") {
    items.push({
      id: "decision-rejected",
      kind: "system",
      title: "Final decision: Not selected",
      body: "The lecturer recorded the outcome for this intake.",
      at: application.updatedAt,
    });
  }

  if (application.isWithdrawn) {
    items.push({
      id: "withdrawn",
      kind: "system",
      title: "Application withdrawn",
      body: "You ended this application. No further messages will be accepted.",
      at: application.withdrawnAt ?? application.updatedAt,
    });
  }

  return items.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}

export function canCandidateSendCorrespondence(
  application: ApplicationResponse
): boolean {
  if (application.isWithdrawn) return false;
  if (application.status === "selected" || application.status === "rejected") {
    return false;
  }
  return application.status === "pending";
}
