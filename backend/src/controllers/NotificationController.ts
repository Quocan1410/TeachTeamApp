import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { NotificationService } from "../services/NotificationService";

export class NotificationController {
    async getMyNotifications(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }

            const notifications =
                await NotificationService.getForUser(userId);
            const unreadCount =
                await NotificationService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                data: {
                    notifications,
                    unreadCount,
                },
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch notifications",
            });
        }
    }

    async markAsRead(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const userId = req.user?.userId;
            const notificationId = parseInt(req.params.id, 10);

            if (!userId || Number.isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request",
                });
                return;
            }

            const updated = await NotificationService.markAsRead(
                notificationId,
                userId
            );

            if (!updated) {
                res.status(404).json({
                    success: false,
                    message: "Notification not found",
                });
                return;
            }

            const unreadCount =
                await NotificationService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                data: { unreadCount },
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update notification",
            });
        }
    }

    async markAllAsRead(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }

            await NotificationService.markAllAsRead(userId);

            res.status(200).json({
                success: true,
                data: { unreadCount: 0 },
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update notifications",
            });
        }
    }

    async deleteNotification(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const userId = req.user?.userId;
            const notificationId = parseInt(req.params.id, 10);

            if (!userId || Number.isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid request",
                });
                return;
            }

            const deleted = await NotificationService.deleteNotification(
                notificationId,
                userId
            );

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: "Notification not found",
                });
                return;
            }

            const unreadCount =
                await NotificationService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                data: { unreadCount },
            });
        } catch (error) {
            console.error("Error deleting notification:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete notification",
            });
        }
    }
}
