"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import axios from "axios";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  fetchNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  StoredNotification,
  NotificationType,
} from "@/shared/services/notificationService";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string | null;
  candidateId?: number;
  candidateName?: string;
  unselectedCount?: number;
  unrankedCount?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchError: string | null;
  refreshNotifications: (options?: { force?: boolean }) => Promise<void>;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

function mapStoredNotification(n: StoredNotification): Notification {
  return {
    id: String(n.id),
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdAt),
    read: Boolean(n.read),
    link: n.link,
    candidateId:
      typeof n.metadata?.candidateId === "number"
        ? n.metadata.candidateId
        : undefined,
    candidateName:
      typeof n.metadata?.candidateName === "string"
        ? n.metadata.candidateName
        : undefined,
    unselectedCount:
      typeof n.metadata?.unselectedApplicationsCount === "number"
        ? n.metadata.unselectedApplicationsCount
        : undefined,
    unrankedCount:
      typeof n.metadata?.unrankedApplicationsCount === "number"
        ? n.metadata.unrankedApplicationsCount
        : undefined,
  };
}

function canReceiveNotifications(
  user: { id: number; userType: string } | null | undefined
): boolean {
  return (
    !!user &&
    (user.userType === "candidate" || user.userType === "lecturer")
  );
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const userType = user?.userType;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const rateLimitedUntilRef = useRef(0);
  const loadedForUserIdRef = useRef<number | null>(null);

  const refreshNotifications = useCallback(
    async (options?: { force?: boolean }) => {
      if (authLoading) {
        return;
      }

      if (
        !isAuthenticated ||
        userId == null ||
        !canReceiveNotifications(
          userType ? { id: userId, userType } : null
        )
      ) {
        setNotifications([]);
        setUnreadCount(0);
        setFetchError(null);
        loadedForUserIdRef.current = null;
        return;
      }

      const activeUserId = userId;
      const now = Date.now();
      if (now < rateLimitedUntilRef.current) {
        return;
      }

      const isInitialLoadForUser = loadedForUserIdRef.current !== activeUserId;
      const shouldSkipDebounce =
        options?.force || isInitialLoadForUser;

      if (
        !shouldSkipDebounce &&
        (inFlightRef.current || now - lastFetchAtRef.current < 2000)
      ) {
        return;
      }

      inFlightRef.current = true;
      lastFetchAtRef.current = now;

      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchNotifications();
        setNotifications(data.notifications.map(mapStoredNotification));
        setUnreadCount(data.unreadCount);
        loadedForUserIdRef.current = activeUserId;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          rateLimitedUntilRef.current = Date.now() + 60_000;
          setFetchError("Too many requests. Try again in a moment.");
          return;
        }

        const message =
          axios.isAxiosError(error) && error.response?.status === 401
            ? "Session expired. Please sign in again."
            : "Could not load notifications.";

        setFetchError(message);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [authLoading, isAuthenticated, userId, userType]
  );

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    const handleFocus = () => {
      void refreshNotifications({ force: true });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authLoading, isAuthenticated, refreshNotifications]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (
      isAuthenticated &&
      userId != null &&
      canReceiveNotifications(userType ? { id: userId, userType } : null)
    ) {
      pollRef.current = setInterval(() => {
        void refreshNotifications();
      }, 120_000);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [isAuthenticated, userId, userType, refreshNotifications]);

  const addNotification = useCallback(
    (notificationData: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notificationData,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => {
        const exists = prev.some(
          (n) =>
            n.title === newNotification.title &&
            n.message === newNotification.message &&
            Math.abs(
              n.timestamp.getTime() - newNotification.timestamp.getTime()
            ) < 5000
        );
        if (exists) return prev;
        return [newNotification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    },
    []
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    const numericId = parseInt(notificationId, 10);
    if (Number.isNaN(numericId)) return;

    try {
      const count = await apiMarkAsRead(numericId);
      setUnreadCount(count);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch {
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const count = await apiMarkAllAsRead();
      setUnreadCount(count);
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch {
    }
  }, []);

  const removeNotification = useCallback(async (notificationId: string) => {
    const numericId = parseInt(notificationId, 10);
    if (Number.isNaN(numericId)) return;

    try {
      const count = await apiDeleteNotification(numericId);
      setUnreadCount(count);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch {
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    loadedForUserIdRef.current = null;
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchError,
    refreshNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
