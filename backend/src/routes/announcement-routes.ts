import { Router } from "express";
import { AnnouncementController } from "../controllers/AnnouncementController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();
const controller = new AnnouncementController();

router.get(
    "/active",
    authenticateToken,
    controller.getActiveAnnouncements.bind(controller)
);

export default router;
