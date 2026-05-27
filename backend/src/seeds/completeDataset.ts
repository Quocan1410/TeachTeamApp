import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { Role } from "../entities/Role";
import { Notification, NotificationType } from "../entities/Notification";
import {
    Announcement,
    AnnouncementAudience,
} from "../entities/Announcement";

const SEED_TAG = "[seed]";

export async function seedCompleteDataset(): Promise<void> {
    if (!AppDataSource.isInitialized) return;

    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Course);
    const roleRepo = AppDataSource.getRepository(Role);
    const draftRepo = AppDataSource.getRepository(ApplicationDraft);
    const notifRepo = AppDataSource.getRepository(Notification);
    const announcementRepo = AppDataSource.getRepository(Announcement);

    const users = await userRepo.find();
    const byEmail = new Map(users.map((u) => [u.email, u]));
    const courses = await courseRepo.find();
    const courseByCode = new Map(courses.map((c) => [c.courseCode, c]));
    const roles = await roleRepo.find();
    const roleByName = new Map(roles.map((r) => [r.roleName, r]));

    for (const u of users) {
        if (u.theme !== "dark") {
            u.theme = "dark";
            await userRepo.save(u);
        }
    }

    const draftSpecs = [
        {
            email: "omar.hassan@candidate.edu.au",
            courseCode: "COSC2758",
            roleName: "lab_assistant",
            payload: {
                availability: "Part Time",
                skills: "Docker, Linux, bash",
                motivation: "Draft — submitting after current project deadline.",
            },
        },
        {
            email: "nina.okonkwo@candidate.edu.au",
            courseCode: "COSC2938",
            roleName: "tutor",
            payload: {
                availability: "Full Time",
                skills: "Algorithms, Python, teaching",
            },
        },
        {
            email: "henry.wong@candidate.edu.au",
            courseCode: "COSC2767",
            roleName: "tutor",
            payload: {
                skills: "AWS, Terraform, Kubernetes",
                experience: "SRE intern 2024",
            },
        },
    ];
    for (const d of draftSpecs) {
        const candidate = byEmail.get(d.email);
        const c = courseByCode.get(d.courseCode);
        const r = roleByName.get(d.roleName);
        if (!candidate || !c || !r) continue;
        const exists = await draftRepo.findOne({
            where: {
                candidateId: candidate.id,
                courseId: c.id,
                roleId: r.id,
            },
        });
        if (!exists) {
            await draftRepo.save(
                draftRepo.create({
                    candidateId: candidate.id,
                    courseId: c.id,
                    roleId: r.id,
                    payload: d.payload,
                })
            );
        }
    }

    const notifSpecs: {
        email: string;
        type: NotificationType;
        title: string;
        message: string;
        link: string;
        read?: boolean;
    }[] = [
        {
            email: "carla.santos@candidate.edu.au",
            type: NotificationType.APPLICATION_SELECTED,
            title: `${SEED_TAG} Selected for COSC2758`,
            message: "Your tutor application was selected.",
            link: "/tutor",
        },
        {
            email: "bob.nguyen@candidate.edu.au",
            type: NotificationType.APPLICATION_REJECTED,
            title: `${SEED_TAG} Application not successful`,
            message: "COSC2758 tutor — see feedback on your dashboard.",
            link: "/tutor",
            read: true,
        },
        {
            email: "daniel.lee@candidate.edu.au",
            type: NotificationType.APPLICATION_COMMENT,
            title: `${SEED_TAG} Lecturer comment`,
            message: "John Smith left notes on your shortlisted application.",
            link: "/tutor",
        },
        {
            email: "john.smith@lecturer.edu.au",
            type: NotificationType.APPLICATION_SUBMITTED,
            title: `${SEED_TAG} New application`,
            message: "Lisa Tran applied for COSC2758 tutor.",
            link: "/lecturer",
        },
        {
            email: "alice.chen@candidate.edu.au",
            type: NotificationType.COURSE_ASSIGNED,
            title: `${SEED_TAG} Course access`,
            message: "You can view COSC2758 on your candidate dashboard.",
            link: "/tutor",
        },
        {
            email: "frank.blocked@candidate.edu.au",
            type: NotificationType.ACCOUNT_BLOCKED,
            title: `${SEED_TAG} Account restricted`,
            message: "Contact admin if you believe this is an error.",
            link: "/signin",
            read: true,
        },
    ];
    for (const n of notifSpecs) {
        const u = byEmail.get(n.email);
        if (!u) continue;
        const exists = await notifRepo.findOne({
            where: { userId: u.id, title: n.title },
        });
        if (!exists) {
            await notifRepo.save(
                notifRepo.create({
                    userId: u.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    link: n.link,
                    read: n.read ?? false,
                })
            );
        }
    }

    const allTitle = `${SEED_TAG} System maintenance window`;
    const hasAll = await announcementRepo.findOne({
        where: { title: allTitle },
    });
    if (!hasAll) {
        const startsAt = new Date();
        const endsAt = new Date();
        endsAt.setMonth(endsAt.getMonth() + 1);
        await announcementRepo.save(
            announcementRepo.create({
                title: allTitle,
                body: "Scheduled maintenance Sunday 2–4am AEST — apps may be briefly unavailable.",
                audience: AnnouncementAudience.ALL,
                startsAt,
                endsAt,
                isActive: true,
            })
        );
    }

    console.log("Complete dataset — drafts, notifications, announcements seeded");
}
