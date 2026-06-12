import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import { Application } from "../entities/Application";
import { Notification } from "../entities/Notification";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { ApplicationDraft } from "../entities/ApplicationDraft";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { RefreshToken } from "../entities/RefreshToken";
import { UserSecurityAnswer } from "../entities/UserSecurityAnswer";
import { SecurityQuestionService } from "../services/SecurityQuestionService";
import {
    EXTRA_LECTURERS,
    EXTRA_CANDIDATES,
    assignExtraCourseLecturers,
    seedApplicationInteractions,
} from "./seedInteractions";
import { WAVE_2_COURSES } from "./seedCoursesWave2";
import {
    seedAdminNotifications,
    seedApplicationDrafts,
    seedBlockedCandidateDemo,
    seedOfferResponsesOnSelected,
    seedUserProfileVariety,
} from "./seedEnrichment";

/** Local dev password for all seeded lecturer and candidate accounts. */
export const DEMO_PASSWORD = "Password123!";

type SecurityAnswerSeed = {
    questionId: string;
    answer: string;
};

export type PersonSeed = {
    email: string;
    firstName: string;
    lastName: string;
    honorific: string;
    securityAnswers: SecurityAnswerSeed[];
};

/** Documented fallback answers (see env.example for per-account values). */
export const DEMO_SECURITY_ANSWERS = [
    { questionId: "birth_city", answer: "Melbourne" },
    { questionId: "first_school", answer: "Northside High School" },
    { questionId: "favorite_book", answer: "Introduction to Algorithms" },
    { questionId: "childhood_nickname", answer: "Lex" },
] as const;

const LECTURERS: PersonSeed[] = [
    {
        email: "jane.morrison@lecturer.edu.au",
        firstName: "Jane",
        lastName: "Morrison",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Melbourne" },
            { questionId: "first_school", answer: "Kew High School" },
            { questionId: "favorite_book", answer: "Clean Code" },
            { questionId: "childhood_nickname", answer: "Janey" },
        ],
    },
    {
        email: "marcus.chen@lecturer.edu.au",
        firstName: "Marcus",
        lastName: "Chen",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Sydney" },
            { questionId: "first_school", answer: "Chatswood High School" },
            { questionId: "favorite_book", answer: "The Elements of Statistical Learning" },
            { questionId: "childhood_nickname", answer: "Mark" },
        ],
    },
    {
        email: "priya.sharma@lecturer.edu.au",
        firstName: "Priya",
        lastName: "Sharma",
        honorific: "Prof.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Adelaide" },
            { questionId: "first_school", answer: "Unley High School" },
            { questionId: "favorite_book", answer: "A Brief History of Time" },
            { questionId: "childhood_nickname", answer: "Pri" },
        ],
    },
];

const CANDIDATES: PersonSeed[] = [
    {
        email: "alex.nguyen@candidate.edu.au",
        firstName: "Alex",
        lastName: "Nguyen",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Ho Chi Minh City" },
            { questionId: "first_school", answer: "Tran Dai Nghia High School" },
            { questionId: "favorite_book", answer: "Structure and Interpretation of Computer Programs" },
            { questionId: "childhood_nickname", answer: "Anh" },
        ],
    },
    {
        email: "samira.patel@candidate.edu.au",
        firstName: "Samira",
        lastName: "Patel",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Brisbane" },
            { questionId: "first_school", answer: "Brisbane State High School" },
            { questionId: "favorite_book", answer: "Thinking, Fast and Slow" },
            { questionId: "childhood_nickname", answer: "Sam" },
        ],
    },
    {
        email: "james.oconnor@candidate.edu.au",
        firstName: "James",
        lastName: "O'Connor",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Dublin" },
            { questionId: "first_school", answer: "Belvedere College" },
            { questionId: "favorite_book", answer: "The Pragmatic Programmer" },
            { questionId: "childhood_nickname", answer: "Jim" },
        ],
    },
];

function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

const COURSE_DEFS = [
    {
        courseCode: "COSC2758",
        courseName: "Full Stack Development",
        semester: "Semester 2 2026",
        description:
            "Design and build modern web applications using React, Node.js, and relational databases.",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 60,
        lecturerEmails: ["jane.morrison@lecturer.edu.au", "marcus.chen@lecturer.edu.au"],
    },
    {
        courseCode: "COSC2123",
        courseName: "Algorithms & Analysis",
        semester: "Semester 2 2026",
        description:
            "Core data structures, algorithm design, and complexity analysis for computer science students.",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 35,
        lecturerEmails: ["jane.morrison@lecturer.edu.au"],
    },
    {
        courseCode: "INTE2400",
        courseName: "Network Engineering",
        semester: "Semester 2 2026",
        description:
            "Routing, switching, and network protocols with practical lab configuration exercises.",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 21,
        lecturerEmails: ["jane.morrison@lecturer.edu.au"],
    },
    {
        courseCode: "COMP9001",
        courseName: "Research Methods",
        semester: "Semester 2 2026",
        description:
            "Graduate-level research design, academic writing, and ethics for thesis preparation.",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: 55,
        lecturerEmails: ["marcus.chen@lecturer.edu.au"],
    },
    {
        courseCode: "COMP9417",
        courseName: "Machine Learning",
        semester: "Semester 2 2026",
        description:
            "Supervised and unsupervised learning, model evaluation, and applied ML workflows in Python.",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 5,
        lecturerEmails: ["marcus.chen@lecturer.edu.au"],
    },
    {
        courseCode: "BUSM1001",
        courseName: "Business Analytics",
        semester: "Semester 2 2026",
        description:
            "Data-driven decision making with spreadsheets, SQL, and visual analytics for business problems.",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 40,
        lecturerEmails: ["marcus.chen@lecturer.edu.au"],
    },
    {
        courseCode: "MATH1131",
        courseName: "Mathematics 1A",
        semester: "Semester 2 2026",
        description:
            "Differential calculus, integral calculus, and introductory linear algebra for science and engineering.",
        maxTutors: 4,
        maxLabAssistants: 0,
        deadlineDays: 50,
        lecturerEmails: ["priya.sharma@lecturer.edu.au"],
    },
    {
        courseCode: "PHYS1161",
        courseName: "Physics 1A",
        semester: "Semester 2 2026",
        description:
            "Classical mechanics, waves, and experimental methods with weekly tutorial problem sets.",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 42,
        lecturerEmails: ["priya.sharma@lecturer.edu.au"],
    },
    {
        courseCode: "ENGG1300",
        courseName: "Engineering Practice",
        semester: "Semester 2 2026",
        description:
            "Professional communication, teamwork, and project delivery in multidisciplinary engineering studios.",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 48,
        lecturerEmails: ["priya.sharma@lecturer.edu.au"],
    },
    {
        courseCode: "ISYS9001",
        courseName: "Enterprise Systems",
        semester: "Semester 2 2026",
        description:
            "Enterprise resource planning, system integration, and process modelling in large organisations.",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 30,
        lecturerEmails: ["marcus.chen@lecturer.edu.au"],
    },
    {
        courseCode: "ACCT5001",
        courseName: "Financial Accounting",
        semester: "Semester 2 2026",
        description:
            "Financial statements, reporting standards, and analysis for postgraduate business students.",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: -10,
        lecturerEmails: ["marcus.chen@lecturer.edu.au"],
    },
    {
        courseCode: "MARK1001",
        courseName: "Marketing Fundamentals",
        semester: "Semester 2 2026",
        description:
            "Consumer behaviour, segmentation, and campaign planning with case studies from Australian markets.",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 3,
        lecturerEmails: ["marcus.chen@lecturer.edu.au"],
    },
] as const;

async function seedSecurityAnswers(
    userId: number,
    answers: SecurityAnswerSeed[]
): Promise<void> {
    const securityService = new SecurityQuestionService();
    await securityService.saveAnswers(userId, answers);
}

/**
 * Bootstrap: dev accounts (10 lecturers, 19 candidates, 1 admin), roles, courses,
 * applications, drafts, notifications, and profile variety — all via the same
 * correspondence / workflow utilities used by the API.
 */
export async function seedBootstrapDataset(): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Course);
    const roleRepo = AppDataSource.getRepository(Role);
    const assignmentRepo = AppDataSource.getRepository(CourseAssignment);
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@admin.com")
        .trim()
        .toLowerCase();
    const adminPasswordHash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "admin",
        12
    );
    const now = new Date();

    await userRepo.save(
        userRepo.create({
            email: adminEmail,
            password: adminPasswordHash,
            firstName: "System",
            lastName: "Administrator",
            userType: UserType.ADMIN,
            isBlocked: false,
        })
    );

    const lecturerByEmail = new Map<string, User>();
    const candidateByEmail = new Map<string, User>();

    for (const def of [...LECTURERS, ...EXTRA_LECTURERS]) {
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
        await seedSecurityAnswers(user.id, def.securityAnswers);
    }

    for (const def of [...CANDIDATES, ...EXTRA_CANDIDATES]) {
        const user = await userRepo.save(
            userRepo.create({
                email: def.email,
                password: passwordHash,
                firstName: def.firstName,
                lastName: def.lastName,
                userType: UserType.CANDIDATE,
                honorific: def.honorific,
                isBlocked: false,
            })
        );
        candidateByEmail.set(def.email, user);
        await seedSecurityAnswers(user.id, def.securityAnswers);
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
    for (const def of [...COURSE_DEFS, ...WAVE_2_COURSES]) {
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
            const exists = await assignmentRepo.findOne({
                where: { lecturerId: lecturer.id, courseId: course.id },
            });
            if (exists) continue;
            await assignmentRepo.save(
                assignmentRepo.create({
                    lecturerId: lecturer.id,
                    courseId: course.id,
                })
            );
        }
    }

    await assignExtraCourseLecturers(courseByCode, lecturerByEmail);

    await seedApplicationInteractions(
        lecturerByEmail,
        candidateByEmail,
        courseByCode,
        tutorRole,
        labRole
    );

    await seedBlockedCandidateDemo(passwordHash);
    await seedApplicationDrafts(
        candidateByEmail,
        courseByCode,
        tutorRole,
        labRole
    );
    await seedOfferResponsesOnSelected();
    await seedUserProfileVariety();
    await seedAdminNotifications(adminEmail);
}

export async function clearAllTables(): Promise<void> {
    await AppDataSource.getRepository(RefreshToken).clear();
    await AppDataSource.getRepository(PasswordResetToken).clear();
    await AppDataSource.getRepository(UserSecurityAnswer).clear();
    await AppDataSource.getRepository(Notification).clear();
    await AppDataSource.getRepository(SelectedCandidate).clear();
    await AppDataSource.getRepository(ApplicationDraft).clear();
    await AppDataSource.getRepository(Application).clear();
    await AppDataSource.getRepository(CourseAssignment).clear();
    await AppDataSource.getRepository(User).clear();
    await AppDataSource.getRepository(Course).clear();
    await AppDataSource.getRepository(Role).clear();
}
