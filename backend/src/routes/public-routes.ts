import { Router } from "express";
import { PublicController } from "../controllers/PublicController";

const router = Router();
const publicController = new PublicController();

router.get(
    "/lecturers",
    publicController.getLecturers.bind(publicController)
);

export default router;
