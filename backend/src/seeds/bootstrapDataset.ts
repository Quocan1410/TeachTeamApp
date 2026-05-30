import bcrypt from "bcryptjs";
import type { DeepPartial } from "typeorm";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application, ApplicationStatus } from "../entities/Application";
import { Notification, NotificationType } from "../entities/Notification";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { Announcement } from "../entities/Announcement";
import { LECTURER_PRIMARY_MESSAGE_ID } from "../utils/correspondenceMessages";
import type { MessageReactionsMap } from "../utils/messageReactions";

export const DEMO_PASSWORD = "Password123!";

const LECTURERS = [
    {
        email: "jane.lecturer@lecturer.edu.au",
        firstName: "Jane",
        lastName: "Lecturer",
        honorific: "Dr.",
    },
    {
        email: "marcus.lecturer@lecturer.edu.au",
        firstName: "Marcus",
        lastName: "Chen",
        honorific: "Dr.",
    },
    {
        email: "priya.lecturer@lecturer.edu.au",
        firstName: "Priya",
        lastName: "Sharma",
        honorific: "Dr.",
    },
    {
        email: "david.lecturer@lecturer.edu.au",
        firstName: "David",
        lastName: "Walsh",
        honorific: "Dr.",
    },
] as const;

const CANDIDATES = [
    {
        email: "alex.candidate@candidate.edu.au",
        firstName: "Alex",
        lastName: "Nguyen",
        honorific: "Mr.",
        isBlocked: false,
    },
    {
        email: "sam.candidate@candidate.edu.au",
        firstName: "Sam",
        lastName: "Patel",
        honorific: "Mr.",
        isBlocked: false,
    },
    {
        email: "riley.candidate@candidate.edu.au",
        firstName: "Riley",
        lastName: "Kim",
        honorific: "Ms.",
        isBlocked: false,
    },
    {
        email: "taylor.candidate@candidate.edu.au",
        firstName: "Taylor",
        lastName: "Brooks",
        honorific: "Ms.",
        isBlocked: true,
    },
] as const;

function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

function addMinutes(base: Date, minutes: number): Date {
    const d = new Date(base);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
}

const COURSE_DEFS = [
    {
        courseCode: "COSC2758",
        courseName: "Full Stack Development",
        semester: "Semester 2 2026",
        description: "React, Node.js, databases",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 60,
        lecturerEmails: ["jane.lecturer@lecturer.edu.au", "marcus.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "COSC2123",
        courseName: "Algorithms & Analysis",
        semester: "Semester 2 2026",
        description: "Data structures and complexity",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 35,
        lecturerEmails: ["jane.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "INTE2400",
        courseName: "Network Engineering",
        semester: "Semester 2 2026",
        description: "Routing, switching, protocols",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 21,
        lecturerEmails: ["jane.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "COMP9001",
        courseName: "Research Methods",
        semester: "Semester 2 2026",
        description: "Graduate research skills",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: 55,
        lecturerEmails: ["marcus.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "COMP9417",
        courseName: "Machine Learning",
        semester: "Semester 2 2026",
        description: "ML foundations and practice",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 5,
        lecturerEmails: ["marcus.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "BUSM1001",
        courseName: "Business Analytics",
        semester: "Semester 2 2026",
        description: "Analytics for business decisions",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 40,
        lecturerEmails: ["marcus.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "MATH1131",
        courseName: "Mathematics 1A",
        semester: "Semester 2 2026",
        description: "Calculus and linear algebra",
        maxTutors: 4,
        maxLabAssistants: 0,
        deadlineDays: 50,
        lecturerEmails: ["priya.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "PHYS1161",
        courseName: "Physics 1A",
        semester: "Semester 2 2026",
        description: "Mechanics and waves",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 42,
        lecturerEmails: ["priya.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "ENGG1300",
        courseName: "Engineering Practice",
        semester: "Semester 2 2026",
        description: "Team projects and communication",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 48,
        lecturerEmails: ["priya.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "ISYS9001",
        courseName: "Enterprise Systems",
        semester: "Semester 2 2026",
        description: "ERP and integration",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 30,
        lecturerEmails: ["david.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "ACCT5001",
        courseName: "Financial Accounting",
        semester: "Semester 2 2026",
        description: "Reporting and analysis (applications closed)",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: -10,
        lecturerEmails: ["david.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "MARK1001",
        courseName: "Marketing Fundamentals",
        semester: "Semester 2 2026",
        description: "Closing soon — urgent deadline",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 3,
        lecturerEmails: ["david.lecturer@lecturer.edu.au"],
    },
] as const;

type ReactionSeedItem = {
    messageId?: string;
    emoji: string;
    actors: Array<"candidate" | "lecturer">;
};

type SeedApplication = {
    candidateEmail: string;
    courseCode: string;
    roleName: "tutor" | "lab_assistant";
    status: ApplicationStatus;
    isWithdrawn?: boolean;
    availability: "Full Time" | "Part Time";
    skills: string;
    experience: string;
    motivation: string;
    lecturerEmail?: string;
    lecturerComment?: string;
    candidateReply?: string;
    rank?: number;
    rankedForCourse?: string;
    /** Per-message emoji reactions (resolved to user ids when seeding). */
    reactionSeed?: ReactionSeedItem[];
    extraMessages?: Array<{
        id: string;
        authorRole: "candidate" | "lecturer";
        body: string;
        replyToMessageId?: string;
    }>;
    candidateReplyToMessageId?: string;
};

function buildMessageReactions(
    def: Pick<SeedApplication, "reactionSeed">,
    candidate: User,
    lecturer?: User
): MessageReactionsMap | undefined {
    if (!def.reactionSeed?.length) {
        return undefined;
    }

    const map: MessageReactionsMap = {};

    for (const item of def.reactionSeed) {
        const messageId = item.messageId ?? LECTURER_PRIMARY_MESSAGE_ID;
        const userIds: number[] = [];

        if (item.actors.includes("candidate")) {
            userIds.push(candidate.id);
        }
        if (item.actors.includes("lecturer") && lecturer) {
            userIds.push(lecturer.id);
        }

        if (userIds.length === 0) {
            continue;
        }

        if (!map[messageId]) {
            map[messageId] = {};
        }
        map[messageId][item.emoji] = [...new Set(userIds)];
    }

    return Object.keys(map).length > 0 ? map : undefined;
}

const APPLICATION_DEFS: SeedApplication[] = [
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "React, TypeScript, Node.js",
        experience: "Led a student dev team for 12 months.",
        motivation: "Want to mentor students in full-stack labs.",
        lecturerEmail: "jane.lecturer@lecturer.edu.au",
        lecturerComment:
            "Strong stack — please confirm tutorial availability.",
        candidateReply: "Available Tuesday and Thursday afternoons.",
        candidateReplyToMessageId: LECTURER_PRIMARY_MESSAGE_ID,
        extraMessages: [
            {
                id: "msg-lecturer-2",
                authorRole: "lecturer",
                body: "Tuesday 2–4pm works well. How would you structure the first React lab?",
            },
            {
                id: "msg-candidate-2",
                authorRole: "candidate",
                body: "I'd open with components and props, then a paired todo checkpoint before homework.",
                replyToMessageId: "msg-lecturer-2",
            },
        ],
        reactionSeed: [
            { emoji: "👍", actors: ["candidate"] },
            { emoji: "❤️", actors: ["lecturer"] },
            { emoji: "👏", actors: ["candidate", "lecturer"] },
            { messageId: "msg-candidate-1", emoji: "😮", actors: ["lecturer"] },
            { messageId: "msg-candidate-2", emoji: "👍", actors: ["lecturer"] },
        ],
    },
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Python, algorithms, proofs",
        experience: "HD in Algorithms; peer tutoring experience.",
        motivation: "Enjoy explaining complexity analysis.",
        lecturerEmail: "jane.lecturer@lecturer.edu.au",
        lecturerComment: "Please share your past tutoring hours.",
        candidateReply: "hi",
        extraMessages: [
            {
                id: "msg-lecturer-2",
                authorRole: "lecturer",
                body: "Thanks — roughly how many hours per week have you tutored before?",
            },
            {
                id: "msg-candidate-2",
                authorRole: "candidate",
                body: "About six hours a week last semester, mostly algorithms help desk.",
            },
        ],
        reactionSeed: [
            { messageId: "msg-candidate-1", emoji: "❤️", actors: ["lecturer"] },
            { messageId: "msg-candidate-2", emoji: "👍", actors: ["lecturer"] },
        ],
    },
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "INTE2400",
        roleName: "lab_assistant",
        status: ApplicationStatus.REJECTED,
        isWithdrawn: true,
        availability: "Part Time",
        skills: "Networking, Cisco basics",
        experience: "CCNA study in progress.",
        motivation: "Hands-on lab support.",
        lecturerEmail: "jane.lecturer@lecturer.edu.au",
        lecturerComment: "Thanks for your interest.",
    },
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "COMP9001",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Full Time",
        skills: "Research writing, LaTeX",
        experience: "Published workshop paper.",
        motivation: "Support grad research workshops.",
        lecturerEmail: "marcus.lecturer@lecturer.edu.au",
        lecturerComment: "Excellent research communication.",
        rank: 1,
        rankedForCourse: "COMP9001",
    },
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "MATH1131",
        roleName: "tutor",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "Calculus, linear algebra",
        experience: "Math help desk volunteer.",
        motivation: "Support first-year students.",
        lecturerEmail: "priya.lecturer@lecturer.edu.au",
        lecturerComment: "Competitive round — not selected this time.",
    },
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "ENGG1300",
        roleName: "tutor",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "Team leadership, CAD basics",
        experience: "Design project captain.",
        motivation: "Facilitate studio sessions.",
        lecturerEmail: "priya.lecturer@lecturer.edu.au",
        lecturerComment: "Good fit but quota filled elsewhere.",
    },
    {
        candidateEmail: "sam.candidate@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Linux, Docker, debugging",
        experience: "IT support intern.",
        motivation: "Help students in lab environment.",
        lecturerEmail: "jane.lecturer@lecturer.edu.au",
        lecturerComment: "Solid lab skills.",
        rank: 2,
        rankedForCourse: "COSC2758",
    },
    {
        candidateEmail: "sam.candidate@candidate.edu.au",
        courseCode: "COMP9417",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Python, scikit-learn, pandas",
        experience: "Kaggle top 15% in tabular comp.",
        motivation: "Support ML tutorials.",
    },
    {
        candidateEmail: "sam.candidate@candidate.edu.au",
        courseCode: "BUSM1001",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Full Time",
        skills: "Excel, SQL, Tableau",
        experience: "Business analyst internship.",
        motivation: "Teach analytics workshops.",
        lecturerEmail: "marcus.lecturer@lecturer.edu.au",
        lecturerComment: "Top analytics candidate.",
        rank: 1,
        rankedForCourse: "BUSM1001",
    },
    {
        candidateEmail: "sam.candidate@candidate.edu.au",
        courseCode: "ACCT5001",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Accounting, Excel",
        experience: "Submitted before deadline closed.",
        motivation: "Support revision sessions.",
        lecturerEmail: "david.lecturer@lecturer.edu.au",
    },
    {
        candidateEmail: "riley.candidate@candidate.edu.au",
        courseCode: "BUSM1001",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "R, statistics, storytelling",
        experience: "Data storytelling competition finalist.",
        motivation: "Second tutor slot for analytics.",
        lecturerEmail: "marcus.lecturer@lecturer.edu.au",
        lecturerComment: "Fills final tutor quota for BUSM1001.",
        rank: 2,
        rankedForCourse: "BUSM1001",
    },
    {
        candidateEmail: "riley.candidate@candidate.edu.au",
        courseCode: "PHYS1161",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Physics, MATLAB",
        experience: "Lab demonstrator in high school outreach.",
        motivation: "Help with mechanics tutorials.",
        lecturerEmail: "priya.lecturer@lecturer.edu.au",
        lecturerComment: "Can you run a sample tutorial outline?",
        candidateReply: "I can demo projectile motion with simulations.",
    },
    {
        candidateEmail: "riley.candidate@candidate.edu.au",
        courseCode: "ENGG1300",
        roleName: "lab_assistant",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "Workshop safety, 3D printing",
        experience: "Maker space volunteer.",
        motivation: "Support prototyping labs.",
        lecturerEmail: "priya.lecturer@lecturer.edu.au",
        lecturerComment: "Not selected for this semester.",
    },
    {
        candidateEmail: "riley.candidate@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "C++, debugging",
        experience: "Competitive programming club.",
        motivation: "Assist algorithm labs.",
        lecturerEmail: "jane.lecturer@lecturer.edu.au",
        lecturerComment: "Share your contest ranking.",
        candidateReply: "Codeforces Specialist — happy to mentor basics.",
    },
    {
        candidateEmail: "taylor.candidate@candidate.edu.au",
        courseCode: "ISYS9001",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "SAP, integration",
        experience: "ERP module HD.",
        motivation: "Enterprise systems tutorials.",
        lecturerEmail: "david.lecturer@lecturer.edu.au",
        lecturerComment: "Account flagged blocked — hold review.",
    },
    {
        candidateEmail: "taylor.candidate@candidate.edu.au",
        courseCode: "MARK1001",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Marketing, presentation",
        experience: "Agency internship.",
        motivation: "Urgent intake — marketing labs.",
        lecturerEmail: "david.lecturer@lecturer.edu.au",
        lecturerComment: "Selected before account block review.",
        rank: 1,
        rankedForCourse: "MARK1001",
    },
    {
        candidateEmail: "sam.candidate@candidate.edu.au",
        courseCode: "MATH1131",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Statistics, tutoring",
        experience: "Two semesters as PASS leader.",
        motivation: "Calculus support classes.",
        lecturerEmail: "priya.lecturer@lecturer.edu.au",
        lecturerComment: "Strong PASS feedback.",
    },
    {
        candidateEmail: "alex.candidate@candidate.edu.au",
        courseCode: "COMP9417",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "TensorFlow, Python",
        experience: "ML club workshop lead.",
        motivation: "Assist neural net labs.",
    },
];

/**
 * Comprehensive local dataset: 4 lecturers, 4 candidates, 12 courses,
 * applications covering pending/selected/rejected/withdrawn, correspondence,
 * rankings, quota-full course, closed deadline, blocked candidate, drafts, notifications.
 */
export async function seedBootstrapDataset(): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Course);
    const roleRepo = AppDataSource.getRepository(Role);
    const assignmentRepo = AppDataSource.getRepository(CourseAssignment);
    const applicationRepo = AppDataSource.getRepository(Application);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const selectedRepo = AppDataSource.getRepository(SelectedCandidate);
    const draftRepo = AppDataSource.getRepository(ApplicationDraft);
    const announcementRepo = AppDataSource.getRepository(Announcement);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const now = new Date();

    const lecturerByEmail = new Map<string, User>();
    for (const def of LECTURERS) {
        const user = await userRepo.save(
            userRepo.create({
                email: def.email,
                password: passwordHash,
                firstName: def.firstName,
                lastName: def.lastName,
                userType: UserType.LECTURER,
                honorific: def.honorific,
            })
        );
        lecturerByEmail.set(def.email, user);
    }

    const candidateByEmail = new Map<string, User>();
    for (const def of CANDIDATES) {
        const user = await userRepo.save(
            userRepo.create({
                email: def.email,
                password: passwordHash,
                firstName: def.firstName,
                lastName: def.lastName,
                userType: UserType.CANDIDATE,
                honorific: def.honorific,
                isBlocked: def.isBlocked,
            })
        );
        candidateByEmail.set(def.email, user);
    }

    for (const roleData of [
        { roleName: "tutor", description: "Tutorial sessions" },
        { roleName: "lab_assistant", description: "Laboratory sessions" },
    ]) {
        await roleRepo.save(roleRepo.create(roleData));
    }

    const tutorRole = await roleRepo.findOneOrFail({
        where: { roleName: "tutor" },
    });
    const labRole = await roleRepo.findOneOrFail({
        where: { roleName: "lab_assistant" },
    });

    const courseByCode = new Map<string, Course>();
    for (const def of COURSE_DEFS) {
        const course = await courseRepo.save(
            courseRepo.create({
                courseCode: def.courseCode,
                courseName: def.courseName,
                semester: def.semester,
                description: def.description,
                maxTutors: def.maxTutors,
                maxLabAssistants: def.maxLabAssistants,
                applicationDeadline: addDays(now, def.deadlineDays),
            })
        );
        courseByCode.set(def.courseCode, course);

        for (const lecturerEmail of def.lecturerEmails) {
            const lecturer = lecturerByEmail.get(lecturerEmail);
            if (!lecturer) continue;
            await assignmentRepo.save(
                assignmentRepo.create({
                    lecturerId: lecturer.id,
                    courseId: course.id,
                })
            );
        }
    }

    for (const def of APPLICATION_DEFS) {
        const candidate = candidateByEmail.get(def.candidateEmail);
        const course = courseByCode.get(def.courseCode);
        if (!candidate || !course) continue;

        const role = def.roleName === "tutor" ? tutorRole : labRole;
        const lecturer = def.lecturerEmail
            ? lecturerByEmail.get(def.lecturerEmail)
            : undefined;
        const chatBase = addDays(now, -4);
        let chatMinuteOffset = 90;

        const correspondenceMessages: Application["correspondenceMessages"] = [];
        const pushCorrespondence = (
            message: NonNullable<Application["correspondenceMessages"]>[number]
        ) => {
            correspondenceMessages.push(message);
            chatMinuteOffset += 55;
        };

        if (def.lecturerComment && lecturer) {
            pushCorrespondence({
                id: LECTURER_PRIMARY_MESSAGE_ID,
                authorRole: "lecturer",
                authorId: lecturer.id,
                body: def.lecturerComment,
                createdAt: addMinutes(chatBase, chatMinuteOffset).toISOString(),
            });
        }
        if (def.candidateReply) {
            pushCorrespondence({
                id: "msg-candidate-1",
                authorRole: "candidate",
                authorId: candidate.id,
                body: def.candidateReply,
                createdAt: addMinutes(chatBase, chatMinuteOffset).toISOString(),
                replyToMessageId: def.candidateReplyToMessageId ?? null,
            });
        }
        for (const extra of def.extraMessages ?? []) {
            pushCorrespondence({
                id: extra.id,
                authorRole: extra.authorRole,
                authorId:
                    extra.authorRole === "lecturer"
                        ? lecturer?.id ?? 0
                        : candidate.id,
                body: extra.body,
                createdAt: addMinutes(chatBase, chatMinuteOffset).toISOString(),
                replyToMessageId: extra.replyToMessageId ?? null,
            });
        }

        const latestLecturer = [...correspondenceMessages]
            .reverse()
            .find((m) => m.authorRole === "lecturer");
        const latestCandidate = [...correspondenceMessages]
            .reverse()
            .find((m) => m.authorRole === "candidate");

        const withdrawnAt = def.isWithdrawn ? addDays(now, -2) : null;

        const applicationData: DeepPartial<Application> = {
            candidateId: candidate.id,
            courseId: course.id,
            roleId: role.id,
            status: def.status,
            isWithdrawn: Boolean(def.isWithdrawn),
            withdrawnAt: withdrawnAt ?? undefined,
            availability: { type: def.availability },
            skills: def.skills,
            experience: def.experience,
            motivation: def.motivation,
            comment: latestLecturer?.body ?? def.lecturerComment,
            commentedBy: latestLecturer?.authorId ?? lecturer?.id,
            commentedAt: latestLecturer
                ? new Date(latestLecturer.createdAt)
                : def.lecturerComment
                  ? now
                  : undefined,
            candidateResponse: latestCandidate?.body ?? def.candidateReply,
            candidateRespondedAt: latestCandidate
                ? new Date(latestCandidate.createdAt)
                : def.candidateReply
                  ? now
                  : undefined,
            correspondenceMessages:
                correspondenceMessages.length > 0
                    ? correspondenceMessages
                    : undefined,
            messageReactions: buildMessageReactions(def, candidate, lecturer),
            rank: def.rank,
            rankedBy: def.rank && lecturer ? lecturer.id : undefined,
            rankedAt: def.rank ? now : undefined,
            rankedForCourse: def.rankedForCourse,
        };

        const application = await applicationRepo.save(
            applicationRepo.create(applicationData)
        );

        if (def.status === ApplicationStatus.SELECTED && lecturer) {
            await selectedRepo.save(
                selectedRepo.create({
                    applicationId: application.id,
                    selectedById: lecturer.id,
                })
            );
        }
    }

    const alex = candidateByEmail.get("alex.candidate@candidate.edu.au");
    const markCourse = courseByCode.get("MARK1001");
    const labRoleId = labRole.id;
    if (alex && markCourse) {
        await draftRepo.save(
            draftRepo.create({
                candidateId: alex.id,
                courseId: markCourse.id,
                roleId: labRoleId,
                payload: {
                    availability: "Part Time",
                    skills: "Branding, social campaigns",
                    experience: "Student marketing club.",
                    motivation: "Draft — not yet submitted.",
                },
            })
        );
    }

    await announcementRepo.save(
        announcementRepo.create({
            title: "Welcome to TeachTeam (local demo)",
            body: "Use the seeded accounts to explore tutor, lecturer, and application flows. Run `npm run db:reset` in the backend folder to refresh data.",
            createdBy: lecturerByEmail.get("jane.lecturer@lecturer.edu.au")!.id,
            isActive: true,
        })
    );

    const notify = async (
        userId: number,
        type: NotificationType,
        title: string,
        message: string,
        link: string,
        read = false
    ) => {
        await notificationRepo.save(
            notificationRepo.create({
                userId,
                type,
                title,
                message,
                link,
                read,
            })
        );
    };

    const jane = lecturerByEmail.get("jane.lecturer@lecturer.edu.au");

    if (alex) {
        await notify(
            alex.id,
            NotificationType.APPLICATION_COMMENT,
            "New feedback on your application",
            "Jane left feedback on your COSC2758 tutor application.",
            "/tutor/applications",
            false
        );
        await notify(
            alex.id,
            NotificationType.APPLICATION_SELECTED,
            "Application selected",
            "You were selected for COMP9001 tutor role.",
            "/tutor/applications",
            true
        );
    }

    if (jane) {
        await notify(
            jane.id,
            NotificationType.APPLICATION_SUBMITTED,
            "New application",
            "A candidate applied for COSC2758 tutor.",
            "/lecturer",
            false
        );
        await notify(
            jane.id,
            NotificationType.APPLICATION_RESPONSE,
            "Candidate replied",
            "Alex sent availability for COSC2758.",
            "/lecturer",
            false
        );
    }
}

export async function clearAllTables(): Promise<void> {
    await AppDataSource.getRepository(Notification).clear();
    await AppDataSource.getRepository(SelectedCandidate).clear();
    await AppDataSource.getRepository(ApplicationDraft).clear();
    await AppDataSource.getRepository(Application).clear();
    await AppDataSource.getRepository(CourseAssignment).clear();
    await AppDataSource.getRepository(Announcement).clear();
    await AppDataSource.getRepository(User).clear();
    await AppDataSource.getRepository(Course).clear();
    await AppDataSource.getRepository(Role).clear();
}
