"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tutor-applications-pinned-ids";
const LEGACY_STORAGE_KEY = "tutor-applications-pinned-id";

function readPinnedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        );
      }
    }

    // Migrate single-id storage from earlier builds.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)?.trim();
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return [legacy];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writePinnedIds(ids: string[]) {
  try {
    if (ids.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function usePinnedApplications() {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    setPinnedIds(readPinnedIds());
  }, []);

  const persist = useCallback((ids: string[]) => {
    setPinnedIds(ids);
    writePinnedIds(ids);
  }, []);

  const pin = useCallback(
    (id: string) => {
      persist([id, ...pinnedIds.filter((pinnedId) => pinnedId !== id)]);
    },
    [persist, pinnedIds]
  );

  const unpin = useCallback(
    (id: string) => {
      persist(pinnedIds.filter((pinnedId) => pinnedId !== id));
    },
    [persist, pinnedIds]
  );

  const togglePin = useCallback(
    (id: string) => {
      if (pinnedIds.includes(id)) unpin(id);
      else pin(id);
    },
    [pin, pinnedIds, unpin]
  );

  const isPinned = useCallback(
    (id: string) => pinnedIds.includes(id),
    [pinnedIds]
  );

  return { pinnedIds, pin, unpin, togglePin, isPinned };
}
