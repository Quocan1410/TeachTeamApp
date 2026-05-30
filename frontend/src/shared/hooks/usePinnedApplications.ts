"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tutor-applications-pinned-id";

export function getStoredPinnedApplicationId(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

export function usePinnedApplications() {
  const [pinnedId, setPinnedId] = useState<number | null>(null);

  useEffect(() => {
    const stored = getStoredPinnedApplicationId();
    if (stored !== null) setPinnedId(stored);
  }, []);

  const pin = useCallback((id: number) => {
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
    (id: number) => {
      if (pinnedId === id) unpin();
      else pin(id);
    },
    [pin, pinnedId, unpin]
  );

  return { pinnedId, pin, unpin, togglePin, isPinned: (id: number) => pinnedId === id };
}
