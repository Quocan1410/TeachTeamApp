import { Router } from "express";
import { LecturerCourseController } from "../controllers/LecturerCourseController";
import {
    authenticateToken,
    requireUserType,
} from "../middleware/authMiddleware";
import { courseCoverUpload } from "../middleware/uploadMiddleware";

const router = Router();
const controller = new LecturerCourseController();

router.use(authenticateToken, requireUserType(["lecturer"]));

router.get("/", controller.listAssigned);
router.get("/timetable", controller.getTimetable);
router.patch("/:courseId", controller.updateCourseDetails);
router.put("/:courseId/sessions", controller.replaceSessions);
router.post("/:courseId/cover", (req, res, next) => {
    courseCoverUpload.single("cover")(req, res, (err) => {
        if (err) {
            const uploadErr = err as { code?: string; message?: string };
            if (uploadErr.code === "LIMIT_FILE_SIZE") {
                res.status(400).json({
                    success: false,
                    message: "Cover image must be 2MB or smaller",
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: uploadErr.message || "Invalid cover upload",
            });
            return;
        }
        void controller.uploadCoverImage(req, res);
    });
});
router.delete("/:courseId/cover", controller.deleteCoverImage);

export default router;
