"use client";

import { useEffect, useState } from "react";
import {
  acquireApplicationSocket,
  releaseApplicationSocket,
} from "@/lib/applicationSocket";
import {
  PRESENCE_CHANGED_EVENT,
  PRESENCE_SUBSCRIBE_EVENT,
  PRESENCE_SYNC_EVENT,
  type PresenceChangedPayload,
  type PresenceSyncPayload,
} from "@/shared/socket/presenceEvents";

/** Realtime online flag for a user (via Socket.IO). False when unknown or offline. */
export function useUserPresence(userId: number | undefined): boolean {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (userId == null) {
      setOnline(false);
      return;
    }

    const socket = acquireApplicationSocket();
    if (!socket) {
      return;
    }

    const subscribe = () => {
      socket.emit(PRESENCE_SUBSCRIBE_EVENT, { userIds: [userId] });
    };

    const handleSync = (payload: PresenceSyncPayload) => {
      const row = payload.statuses.find((s) => s.userId === userId);
      if (row) {
        setOnline(row.online);
      }
    };

    const handleChanged = (payload: PresenceChangedPayload) => {
      if (payload.userId === userId) {
        setOnline(payload.online);
      }
    };

    socket.on(PRESENCE_SYNC_EVENT, handleSync);
    socket.on(PRESENCE_CHANGED_EVENT, handleChanged);
    socket.on("connect", subscribe);
    subscribe();

    return () => {
      socket.off(PRESENCE_SYNC_EVENT, handleSync);
      socket.off(PRESENCE_CHANGED_EVENT, handleChanged);
      socket.off("connect", subscribe);
      releaseApplicationSocket();
    };
  }, [userId]);

  return online;
}
