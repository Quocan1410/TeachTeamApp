export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
export const VN_LOCALE = "vi-VN";

/** Calendar date YYYY-MM-DD in Vietnam timezone. */
export function vietnamDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: VN_TIMEZONE });
}

function vietnamTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(VN_LOCALE, {
    timeZone: VN_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

function vietnamDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(VN_LOCALE, {
    timeZone: VN_TIMEZONE,
    day: "numeric",
    month: "short",
  });
}

export function formatConversationTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const todayKey = vietnamDateKey(now.toISOString());
    const messageKey = vietnamDateKey(iso);

    if (messageKey === todayKey) {
      return vietnamTimeLabel(iso);
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageKey === vietnamDateKey(yesterday.toISOString())) {
      return `Yesterday · ${vietnamTimeLabel(iso)}`;
    }

    if (diffHours < 24 * 7) {
      const days = Math.max(1, Math.floor(diffHours / 24));
      return `${days}d ago · ${vietnamTimeLabel(iso)}`;
    }

    return `${vietnamDateLabel(iso)} · ${vietnamTimeLabel(iso)}`;
  } catch {
    return iso;
  }
}

export function formatDateDivider(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString(VN_LOCALE, {
        timeZone: VN_TIMEZONE,
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  } catch {
    return iso;
  }
}

/** Date divider label for application submission (date + time, VN locale). */
export function formatAppliedDateDivider(iso: string): string {
  try {
    return `${formatDateDivider(iso)} · ${vietnamTimeLabel(iso)}`;
  } catch {
    return iso;
  }
}

export function dateKey(iso: string): string {
  return vietnamDateKey(iso);
}

export function formatFullTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(VN_LOCALE, {
      timeZone: VN_TIMEZONE,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
