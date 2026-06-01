import { Response } from "express";
import { AppDataSource } from "../config/database";
import {
    ApplicationDraft,
    ApplicationDraftPayload,
} from "../entities/ApplicationDraft";
import { Application } from "../entities/Application";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { assertCourseAcceptsApplications } from "../utils/courseDeadline";

export class ApplicationDraftController {
    private draftRepo = AppDataSource.getRepository(ApplicationDraft);
    private applicationRepo = AppDataSource.getRepository(Application);
    private courseRepo = AppDataSource.getRepository(Course);
    private roleRepo = AppDataSource.getRepository(Role);

    async getDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const candidateId = req.user!.userId;
            const courseId = parseInt(req.params.courseId, 10);
            const roleId = parseInt(req.params.roleId, 10);

            const draft = await this.draftRepo.findOne({
                where: { candidateId, courseId, roleId },
            });

            res.status(200).json({ success: true, data: draft ?? null });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async listDrafts(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const candidateId = req.user!.userId;
            const drafts = await this.draftRepo.find({
                where: { candidateId },
                relations: ["course", "role"],
                order: { updatedAt: "DESC" },
            });
            res.status(200).json({ success: true, data: drafts });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async upsertDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const candidateId = req.user!.userId;
            const courseId = parseInt(req.params.courseId, 10);
            const roleId = parseInt(req.params.roleId, 10);
            const payload = req.body.payload as ApplicationDraftPayload;

            if (!payload || typeof payload !== "object") {
                res.status(400).json({
                    success: false,
                    message: "Draft payload is required",
                });
                return;
            }

            const course = await this.courseRepo.findOne({ where: { id: courseId } });
            const role = await this.roleRepo.findOne({ where: { id: roleId } });
            if (!course || !role) {
                res.status(404).json({
                    success: false,
                    message: "Course or role not found",
                });
                return;
            }

            const existingApp = await this.applicationRepo.findOne({
                where: { candidateId, courseId, roleId },
            });
            if (existingApp) {
                res.status(409).json({
                    success: false,
                    message: "Application already submitted for this course and role",
                });
                return;
            }

            const deadlineCheck = assertCourseAcceptsApplications(course);
            if (!deadlineCheck.ok) {
                res.status(400).json({
                    success: false,
                    message: deadlineCheck.message,
                });
                return;
            }

            let draft = await this.draftRepo.findOne({
                where: { candidateId, courseId, roleId },
            });

            if (draft) {
                draft.payload = payload;
            } else {
                draft = this.draftRepo.create({
                    candidateId,
                    courseId,
                    roleId,
                    payload,
                });
            }

            const saved = await this.draftRepo.save(draft);
            res.status(200).json({
                success: true,
                message: "Draft saved",
                data: saved,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async deleteDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const candidateId = req.user!.userId;
            const courseId = parseInt(req.params.courseId, 10);
            const roleId = parseInt(req.params.roleId, 10);

            await this.draftRepo.delete({ candidateId, courseId, roleId });
            res.status(200).json({ success: true, message: "Draft deleted" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}
