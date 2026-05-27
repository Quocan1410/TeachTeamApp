import axios from "axios";
import { env } from "@/lib/env";

const notificationAPI = axios.create({
  baseURL: `${env.apiEndpoint}/notifications`,
  headers: {
    "Content-Type": "application/json",
  },
});

notificationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type NotificationType =
  | "application_submitted"
  | "application_selected"
  | "application_rejected"
  | "application_comment"
  | "candidate_blocked"
  | "candidate_unblocked"
  | "account_blocked"
  | "account_unblocked"
  | "user_registered"
  | "course_assigned";

export interface StoredNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: StoredNotification[];
  unreadCount: number;
}

export async function fetchNotifications(): Promise<NotificationListResponse> {
  const response = await notificationAPI.get<{
    success: boolean;
    data: NotificationListResponse;
  }>("/");
  return response.data.data;
}

export async function markNotificationAsRead(
  id: number
): Promise<number> {
  const response = await notificationAPI.put<{
    success: boolean;
    data: { unreadCount: number };
  }>(`/${id}/read`);
  return response.data.data.unreadCount;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await notificationAPI.put<{
    success: boolean;
    data: { unreadCount: number };
  }>("/read-all");
  return response.data.data.unreadCount;
}

export async function deleteNotification(id: number): Promise<number> {
  const response = await notificationAPI.delete<{
    success: boolean;
    data: { unreadCount: number };
  }>(`/${id}`);
  return response.data.data.unreadCount;
}
