import { AppDataSource } from "../config/database";
import {
    Announcement,
    AnnouncementAudience,
} from "../entities/Announcement";

const SEED_ANNOUNCEMENTS = [
    {
        title: "Welcome to TeachTeam",
        body: "Check course deadlines before you apply. Track your applications on the candidate dashboard.",
        audience: AnnouncementAudience.CANDIDATE,
    },
    {
        title: "COSC2671 closes soon",
        body: "Introduction to Web Programming — applications close in 4 days.",
        audience: AnnouncementAudience.CANDIDATE,
    },
    {
        title: "COSC2401 deadline reminder",
        body: "Database Systems (Semester 2 2026) — apply within 7 days.",
        audience: AnnouncementAudience.CANDIDATE,
    },
    {
        title: "New courses: Semester 2 2026",
        body: "COSC2510, COSC2810, COSC2207, and COSC2625 are now open for tutor and lab applications.",
        audience: AnnouncementAudience.CANDIDATE,
    },
    {
        title: "Lecturer: use Kanban view",
        body: "Shortlisted column is live — drag applicants or use quick status buttons.",
        audience: AnnouncementAudience.LECTURER,
    },
];

export async function seedAnnouncements(): Promise<void> {
    const repo = AppDataSource.getRepository(Announcement);
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 3);

    for (const item of SEED_ANNOUNCEMENTS) {
        const exists = await repo.findOne({ where: { title: item.title } });
        if (exists) continue;
        await repo.save(
            repo.create({
                ...item,
                startsAt,
                endsAt,
                isActive: true,
            })
        );
    }
}
