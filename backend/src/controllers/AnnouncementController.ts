import { Response } from "express";
import { AppDataSource } from "../config/database";
import {
    Announcement,
    AnnouncementAudience,
} from "../entities/Announcement";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { UserType } from "../entities/User";

export class AnnouncementController {
    private announcementRepo = AppDataSource.getRepository(Announcement);

    async getActiveAnnouncements(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const userType = req.user?.userType;
            const now = new Date();

            const announcements = await this.announcementRepo.find({
                where: { isActive: true },
                order: { createdAt: "DESC" },
            });

            const filtered = announcements.filter((item) => {
                if (item.startsAt && item.startsAt > now) return false;
                if (item.endsAt && item.endsAt < now) return false;

                if (item.audience === AnnouncementAudience.ALL) return true;
                if (
                    item.audience === AnnouncementAudience.CANDIDATE &&
                    userType === UserType.CANDIDATE
                ) {
                    return true;
                }
                if (
                    item.audience === AnnouncementAudience.LECTURER &&
                    userType === UserType.LECTURER
                ) {
                    return true;
                }
                return false;
            });

            res.status(200).json({ success: true, data: filtered });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}
