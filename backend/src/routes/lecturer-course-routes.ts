import { Router } from "express";
import { LecturerCourseController } from "../controllers/LecturerCourseController";
import {
    authenticateToken,
    requireUserType,
} from "../middleware/authMiddleware";

const router = Router();
const controller = new LecturerCourseController();

router.use(authenticateToken, requireUserType(["lecturer"]));

router.get("/", controller.listAssigned);
router.get("/timetable", controller.getTimetable);
router.patch("/:courseId", controller.updateCourseDetails);
router.put("/:courseId/sessions", controller.replaceSessions);

export default router;
