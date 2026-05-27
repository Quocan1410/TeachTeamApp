import { Router } from "express";
import { ApplicationDraftController } from "../controllers/ApplicationDraftController";
import {
    authenticateToken,
    requireUserType,
} from "../middleware/authMiddleware";

const router = Router();
const controller = new ApplicationDraftController();

router.get(
    "/",
    authenticateToken,
    requireUserType(["candidate"]),
    controller.listDrafts.bind(controller)
);

router.get(
    "/:courseId/:roleId",
    authenticateToken,
    requireUserType(["candidate"]),
    controller.getDraft.bind(controller)
);

router.put(
    "/:courseId/:roleId",
    authenticateToken,
    requireUserType(["candidate"]),
    controller.upsertDraft.bind(controller)
);

router.delete(
    "/:courseId/:roleId",
    authenticateToken,
    requireUserType(["candidate"]),
    controller.deleteDraft.bind(controller)
);

export default router;
