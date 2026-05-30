"use client";

import { useEffect, useRef } from "react";
import {
  acquireApplicationSocket,
  APPLICATION_UPDATED_EVENT,
  releaseApplicationSocket,
} from "@/lib/applicationSocket";
import type { ApplicationUpdatedPayload } from "@/shared/socket/applicationEvents";

type UseApplicationRealtimeOptions = {
  enabled: boolean;
  onApplicationUpdated: (payload: ApplicationUpdatedPayload) => void;
};

export function useApplicationRealtime({
  enabled,
  onApplicationUpdated,
}: UseApplicationRealtimeOptions): void {
  const onUpdateRef = useRef(onApplicationUpdated);

  useEffect(() => {
    onUpdateRef.current = onApplicationUpdated;
  }, [onApplicationUpdated]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = acquireApplicationSocket();
    if (!socket) {
      return;
    }

    const handleUpdate = (payload: ApplicationUpdatedPayload) => {
      onUpdateRef.current(payload);
    };

    socket.on(APPLICATION_UPDATED_EVENT, handleUpdate);

    return () => {
      socket.off(APPLICATION_UPDATED_EVENT, handleUpdate);
      releaseApplicationSocket();
    };
  }, [enabled]);
}
