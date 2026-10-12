import type { NotificationType } from "@/shared/services/notificationService";

export type NotificationNavTarget = {
  href: string;
  actionLabel: string;
  hint: string;
};

function canOpenPath(href: string, userType?: string | null): boolean {
  if (!userType) return false;
  if (href.startsWith("/lecturer")) return userType === "lecturer";
  if (href.startsWith("/tutor")) return userType === "candidate";
  return false;
}

function withApplicationQuery(base: string, applicationId?: string): string {
  if (!applicationId?.trim()) return base;
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}applicationId=${encodeURIComponent(applicationId.trim())}`;
}

/**
 * Resolve a permission-aware destination for a notification.
 * Prefers deep links with applicationId so lecturers land on the right chat.
 */
export function resolveNotificationNav(input: {
  type: NotificationType | string;
  link?: string | null;
  applicationId?: string;
  userType?: string | null;
}): NotificationNavTarget | null {
  const { type, link, applicationId, userType } = input;

  let href: string | null = null;
  let actionLabel = "Open";
  let hint = "Opens the related page.";

  if (userType === "lecturer" && applicationId) {
    href = withApplicationQuery("/lecturer", applicationId);
    if (type === "application_response") {
      actionLabel = "Open chat";
      hint = "Opens this application so you can read the candidate’s reply.";
    } else if (type === "application_submitted") {
      actionLabel = "View application";
      hint = "Opens this application on your hiring desk.";
    } else if (type === "application_withdrawn") {
      actionLabel = "View application";
      hint = "Opens the withdrawn application on your dashboard.";
    } else {
      actionLabel = "Open dashboard";
      hint = "Opens this item on your lecturer dashboard.";
    }
  } else if (userType === "candidate" && applicationId) {
    href = withApplicationQuery("/tutor/applications", applicationId);
    if (type === "application_comment") {
      actionLabel = "Open chat";
      hint = "Opens your applications so you can read the lecturer’s feedback.";
    } else {
      actionLabel = "View application";
      hint = "Opens your applications list.";
    }
  } else if (link && canOpenPath(link, userType)) {
    href = withApplicationQuery(link, applicationId);
    if (href.startsWith("/lecturer")) {
      actionLabel = "Open dashboard";
      hint = "Opens your lecturer dashboard.";
    } else {
      actionLabel = "Open page";
      hint = "Opens the related page.";
    }
  }

  if (!href || !canOpenPath(href, userType)) return null;
  return { href, actionLabel, hint };
}
