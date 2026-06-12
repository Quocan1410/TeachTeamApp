import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import {
    Application,
    ApplicationStatus,
    OfferResponse,
} from "../entities/Application";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import {
    Notification,
    NotificationType,
} from "../entities/Notification";
type DraftSeed = {
    candidateEmail: string;
    courseCode: string;
    roleName: "tutor" | "lab_assistant";
    payload: {
        availability?: string;
        skills?: string;
        experience?: string;
        motivation?: string;
    };
};

const APPLICATION_DRAFTS: DraftSeed[] = [
    {
        candidateEmail: "ethan.brooks@candidate.edu.au",
        courseCode: "COMP9001",
        roleName: "tutor",
        payload: {
            availability: "Part Time",
            skills: "Thesis editing, Zotero, academic integrity",
            motivation: "Still drafting my motivation paragraph for research methods.",
        },
    },
    {
        candidateEmail: "zoe.hayes@candidate.edu.au",
        courseCode: "ACCT5001",
        roleName: "tutor",
        payload: {
            availability: "Part Time",
            skills: "Financial modelling, Excel, case summaries",
            experience: "Accounting society workshop organiser.",
        },
    },
    {
        candidateEmail: "grace.adeyemi@candidate.edu.au",
        courseCode: "ENGG1300",
        roleName: "lab_assistant",
        payload: {
            availability: "Full Time",
            skills: "Workshop safety, 3D printing, CAD basics",
        },
    },
    {
        candidateEmail: "noah.park@candidate.edu.au",
        courseCode: "COMP9417",
        roleName: "lab_assistant",
        payload: {
            availability: "Part Time",
            skills: "PyTorch, GPU drivers, conda environments",
            motivation: "Planning to submit once my exam timetable is confirmed.",
        },
    },
    {
        candidateEmail: "lucas.mueller@candidate.edu.au",
        courseCode: "PHYS1161",
        roleName: "tutor",
        payload: {
            availability: "Part Time",
            skills: "Mechanics, waves, problem-set coaching",
        },
    },
    {
        candidateEmail: "hannah.choi@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "tutor",
        payload: {
            availability: "Part Time",
            skills: "C++, STL, complexity analysis",
            experience: "Algorithms study group member.",
        },
    },
    {
        candidateEmail: "ryan.obrien@candidate.edu.au",
        courseCode: "MARK1001",
        roleName: "tutor",
        payload: {
            availability: "Part Time",
            skills: "Brand strategy, consumer interviews",
        },
    },
    {
        candidateEmail: "sofia.rossi@candidate.edu.au",
        courseCode: "INTE2400",
        roleName: "lab_assistant",
        payload: {
            availability: "Part Time",
            skills: "Subnetting, Wireshark, lab cabling",
        },
    },
];

const BLOCKED_CANDIDATE_EMAIL = "spam.tester@candidate.edu.au";

export async function seedBlockedCandidateDemo(
    passwordHash: string
): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOne({
        where: { email: BLOCKED_CANDIDATE_EMAIL },
    });
    if (existing) {
        existing.isBlocked = true;
        return userRepo.save(existing);
    }

    return userRepo.save(
        userRepo.create({
            email: BLOCKED_CANDIDATE_EMAIL,
            password: passwordHash,
            firstName: "Jordan",
            lastName: "Spencer",
            userType: UserType.CANDIDATE,
            honorific: "Mr.",
            isBlocked: true,
            theme: "dark",
        })
    );
}

export async function seedUserProfileVariety(): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({
        where: [{ userType: UserType.LECTURER }, { userType: UserType.CANDIDATE }],
    });

    const lightEmails = new Set([
        "jane.morrison@lecturer.edu.au",
        "elena.voss@lecturer.edu.au",
        "hannah.walsh@lecturer.edu.au",
        "alex.nguyen@candidate.edu.au",
        "mia.tan@candidate.edu.au",
        "zoe.hayes@candidate.edu.au",
        "priya.nair@candidate.edu.au",
        "grace.adeyemi@candidate.edu.au",
    ]);

    for (const user of users) {
        user.theme = lightEmails.has(user.email) ? "light" : "dark";
    }

    await userRepo.save(users);
}

export async function seedApplicationDrafts(
    candidateByEmail: Map<string, User>,
    courseByCode: Map<string, Course>,
    tutorRole: Role,
    labRole: Role
): Promise<void> {
    const draftRepo = AppDataSource.getRepository(ApplicationDraft);

    for (const draft of APPLICATION_DRAFTS) {
        const candidate = candidateByEmail.get(draft.candidateEmail);
        const course = courseByCode.get(draft.courseCode);
        if (!candidate || !course) continue;

        const role = draft.roleName === "tutor" ? tutorRole : labRole;
        const exists = await draftRepo.findOne({
            where: {
                candidateId: candidate.id,
                courseId: course.id,
                roleId: role.id,
            },
        });
        if (exists) continue;

        await draftRepo.save(
            draftRepo.create({
                candidateId: candidate.id,
                courseId: course.id,
                roleId: role.id,
                payload: draft.payload,
            })
        );
    }
}

export async function seedOfferResponsesOnSelected(): Promise<void> {
    const applicationRepo = AppDataSource.getRepository(Application);
    const selected = await applicationRepo.find({
        where: { status: ApplicationStatus.SELECTED, isWithdrawn: false },
        relations: ["candidate", "course", "role"],
        order: { id: "ASC" },
    });

    let pendingSet = false;
    for (const application of selected) {
        if (application.offerResponse) continue;

        if (!pendingSet) {
            application.offerResponse = OfferResponse.PENDING;
            pendingSet = true;
        } else if (application.candidate?.email === "samira.patel@candidate.edu.au") {
            application.offerResponse = OfferResponse.ACCEPTED;
            application.offerRespondedAt = new Date();
        } else if (application.candidate?.email === "mia.tan@candidate.edu.au") {
            application.offerResponse = OfferResponse.ACCEPTED;
            application.offerRespondedAt = new Date();
        } else {
            application.offerResponse = OfferResponse.ACCEPTED;
            application.offerRespondedAt = new Date();
        }
    }

    await applicationRepo.save(selected);
}

export async function seedAdminNotifications(adminEmail: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const notificationRepo = AppDataSource.getRepository(Notification);

    const admin = await userRepo.findOne({
        where: { email: adminEmail.toLowerCase(), userType: UserType.ADMIN },
    });
    if (!admin) return;

    const existingCount = await notificationRepo.count({
        where: { userId: admin.id },
    });
    if (existingCount >= 10) return;

    const lecturers = await userRepo.find({
        where: { userType: UserType.LECTURER },
        order: { id: "ASC" },
        take: 6,
    });
    const candidates = await userRepo.find({
        where: { userType: UserType.CANDIDATE, isBlocked: false },
        order: { id: "ASC" },
        take: 8,
    });
    const blocked = await userRepo.findOne({
        where: { email: BLOCKED_CANDIDATE_EMAIL },
    });

    const seeds: Array<{
        type: NotificationType;
        title: string;
        message: string;
        link?: string;
        read?: boolean;
        metadata?: Record<string, unknown>;
    }> = [];

    lecturers.slice(0, 4).forEach((lecturer, index) => {
        seeds.push({
            type: NotificationType.USER_REGISTERED,
            title: "New lecturer registered",
            message: `${lecturer.firstName} ${lecturer.lastName} (${lecturer.email}) joined the platform.`,
            link: "/dashboard/users",
            read: index % 2 === 0,
            metadata: { userId: lecturer.id, userType: "lecturer" },
        });
    });

    candidates.slice(0, 5).forEach((candidate, index) => {
        seeds.push({
            type: NotificationType.USER_REGISTERED,
            title: "New candidate registered",
            message: `${candidate.firstName} ${candidate.lastName} created a candidate account.`,
            link: "/dashboard/users",
            read: index % 3 === 0,
            metadata: { userId: candidate.id, userType: "candidate" },
        });
    });

    if (blocked) {
        seeds.push({
            type: NotificationType.CANDIDATE_BLOCKED,
            title: "Candidate blocked",
            message: `${blocked.firstName} ${blocked.lastName} was blocked for policy violations.`,
            link: "/dashboard/users",
            read: false,
            metadata: { candidateId: blocked.id },
        });
    }

    seeds.push(
        {
            type: NotificationType.COURSE_ASSIGNED,
            title: "Course assignment updated",
            message: "Dr. Hannah Walsh was assigned to LAWS1001 — Introduction to Law.",
            link: "/dashboard/courses",
            read: true,
            metadata: { courseCode: "LAWS1001" },
        },
        {
            type: NotificationType.COURSE_ASSIGNED,
            title: "Course assignment updated",
            message: "Prof. Tomás Rivera was assigned to BIOL1001 — Cell Biology.",
            link: "/dashboard/courses",
            read: false,
            metadata: { courseCode: "BIOL1001" },
        },
        {
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "Application activity",
            message: "12 new applications were submitted across science and law courses this week.",
            link: "/dashboard/reports",
            read: false,
        },
        {
            type: NotificationType.APPLICATION_SELECTED,
            title: "Selections confirmed",
            message: "Lecturers confirmed final selections for MATH1131 and BUSM1001.",
            link: "/dashboard/reports",
            read: true,
        },
        {
            type: NotificationType.APPLICATION_WITHDRAWN,
            title: "Application withdrawn",
            message: "Oscar Silva withdrew an ENGG1300 application after a schedule change.",
            link: "/dashboard/reports",
            read: true,
            metadata: { courseCode: "ENGG1300" },
        },
        {
            type: NotificationType.APPLICATION_RESPONSE,
            title: "High candidate engagement",
            message: "Multiple candidates replied to lecturer feedback in COMP9417 and LAWS1001.",
            link: "/dashboard/reports",
            read: false,
        }
    );

    for (const seed of seeds) {
        await notificationRepo.save(
            notificationRepo.create({
                userId: admin.id,
                type: seed.type,
                title: seed.title,
                message: seed.message,
                link: seed.link,
                metadata: seed.metadata,
                read: seed.read ?? false,
            })
        );
    }
}
