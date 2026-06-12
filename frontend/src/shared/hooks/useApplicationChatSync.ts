"use client";

import { useEffect, useRef } from "react";
import {
  ApplicationService,
  type ApplicationResponse,
} from "@/shared/services/applicationService";

const CHAT_POLL_MS = 8_000;

type UseApplicationChatSyncOptions = {
  applicationId: number;
  enabled: boolean;
  onApplicationUpdated: (application: ApplicationResponse) => void;
};

export function useApplicationChatSync({
  applicationId,
  enabled,
  onApplicationUpdated,
}: UseApplicationChatSyncOptions): void {
  const onUpdateRef = useRef(onApplicationUpdated);

  useEffect(() => {
    onUpdateRef.current = onApplicationUpdated;
  }, [onApplicationUpdated]);

  useEffect(() => {
    if (!enabled || !applicationId) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const response = await ApplicationService.getApplicationById(
        applicationId
      );
      if (cancelled || !response.success || !response.data) {
        return;
      }
      onUpdateRef.current(response.data);
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, CHAT_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [applicationId, enabled]);
}
