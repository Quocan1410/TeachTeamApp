"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tutor-applications-pinned-id";

export function getStoredPinnedApplicationId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const id = raw?.trim();
    return id ? id : null;
  } catch {
    return null;
  }
}

export function usePinnedApplications() {
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredPinnedApplicationId();
    if (stored !== null) setPinnedId(stored);
  }, []);

  const pin = useCallback((id: string) => {
    setPinnedId(id);
    try {
      localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* ignore */
    }
  }, []);

  const unpin = useCallback(() => {
    setPinnedId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePin = useCallback(
    (id: string) => {
      if (pinnedId === id) unpin();
      else pin(id);
    },
    [pin, pinnedId, unpin]
  );

  return { pinnedId, pin, unpin, togglePin, isPinned: (id: string) => pinnedId === id };
}
