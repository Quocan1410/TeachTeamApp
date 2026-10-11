const PREFIX = "teachteam-page-tour:";

export function tourStorageKey(tourId: string, userId?: string | null): string {
  return `${PREFIX}${tourId}:${userId || "anon"}`;
}

export function hasCompletedTour(tourId: string, userId?: string | null): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(tourStorageKey(tourId, userId)) === "1";
  } catch {
    return true;
  }
}

export function markTourCompleted(tourId: string, userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(tourStorageKey(tourId, userId), "1");
  } catch {
    // private mode / blocked storage — ignore
  }
}

export function clearTourCompleted(tourId: string, userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(tourStorageKey(tourId, userId));
  } catch {
    // ignore
  }
}
