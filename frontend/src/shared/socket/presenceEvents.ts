export const PRESENCE_SUBSCRIBE_EVENT = "presence:subscribe";
export const PRESENCE_SYNC_EVENT = "presence:sync";
export const PRESENCE_CHANGED_EVENT = "presence:changed";

export type PresenceStatus = {
  userId: number;
  online: boolean;
};

export type PresenceSyncPayload = {
  statuses: PresenceStatus[];
};

export type PresenceChangedPayload = {
  userId: number;
  online: boolean;
};

export type PresenceSubscribePayload = {
  userIds: number[];
};
