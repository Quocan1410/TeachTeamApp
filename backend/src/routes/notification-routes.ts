import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();
const controller = new NotificationController();

router.get(
    "/",
    authenticateToken,
    controller.getMyNotifications.bind(controller)
);

router.put(
    "/read-all",
    authenticateToken,
    controller.markAllAsRead.bind(controller)
);

router.put(
    "/:id/read",
    authenticateToken,
    controller.markAsRead.bind(controller)
);

router.delete(
    "/:id",
    authenticateToken,
    controller.deleteNotification.bind(controller)
);

export default router;
