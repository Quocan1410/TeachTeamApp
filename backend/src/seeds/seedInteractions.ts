import type { DeepPartial } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import { CourseAssignment } from "../entities/CourseAssignment";
import {
    Application,
    ApplicationStatus,
    OfferResponse,
} from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { NotificationService } from "../services/NotificationService";
import {
    appendCandidateMessage,
    appendLecturerMessage,
    getCorrespondenceMessages,
    syncLegacyCorrespondenceFields,
} from "../utils/correspondenceMessages";
import { countActiveSelectedForRole } from "../utils/coursePositionCounts";
import type { PersonSeed } from "./bootstrapDataset";
import {
    WAVE_2_LECTURERS,
    WAVE_2_CANDIDATES,
} from "./seedPersonasWave2";
import { WAVE_2_COURSE_ASSIGNMENTS } from "./seedCoursesWave2";
import { WAVE_2_APPLICATION_SCENARIOS } from "./seedScenariosWave2";

export const EXTRA_LECTURERS: PersonSeed[] = [
    ...WAVE_2_LECTURERS,
    {
        email: "elena.voss@lecturer.edu.au",
        firstName: "Elena",
        lastName: "Voss",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Hamburg" },
            { questionId: "first_school", answer: "Gymnasium Hamburg" },
            { questionId: "favorite_book", answer: "Financial Intelligence" },
            { questionId: "childhood_nickname", answer: "Leni" },
        ],
    },
    {
        email: "noah.fischer@lecturer.edu.au",
        firstName: "Noah",
        lastName: "Fischer",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Perth" },
            { questionId: "first_school", answer: "Willetton Senior High School" },
            { questionId: "favorite_book", answer: "Computer Networking" },
            { questionId: "childhood_nickname", answer: "Ned" },
        ],
    },
    {
        email: "rachel.okonkwo@lecturer.edu.au",
        firstName: "Rachel",
        lastName: "Okonkwo",
        honorific: "Dr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Lagos" },
            { questionId: "first_school", answer: "Queens College Lagos" },
            { questionId: "favorite_book", answer: "The Martian" },
            { questionId: "childhood_nickname", answer: "Ray" },
        ],
    },
    {
        email: "wei.zhang@lecturer.edu.au",
        firstName: "Wei",
        lastName: "Zhang",
        honorific: "Prof.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Shanghai" },
            { questionId: "first_school", answer: "Shanghai High School" },
            { questionId: "favorite_book", answer: "Pattern Recognition and Machine Learning" },
            { questionId: "childhood_nickname", answer: "Weiwei" },
        ],
    },
];

export const EXTRA_CANDIDATES: PersonSeed[] = [
    ...WAVE_2_CANDIDATES,
    {
        email: "mia.tan@candidate.edu.au",
        firstName: "Mia",
        lastName: "Tan",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Singapore" },
            { questionId: "first_school", answer: "Raffles Institution" },
            { questionId: "favorite_book", answer: "Designing Data-Intensive Applications" },
            { questionId: "childhood_nickname", answer: "Mi" },
        ],
    },
    {
        email: "liam.carter@candidate.edu.au",
        firstName: "Liam",
        lastName: "Carter",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Canberra" },
            { questionId: "first_school", answer: "Canberra Grammar School" },
            { questionId: "favorite_book", answer: "Naked Statistics" },
            { questionId: "childhood_nickname", answer: "Lee" },
        ],
    },
    {
        email: "aisha.rahman@candidate.edu.au",
        firstName: "Aisha",
        lastName: "Rahman",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Kuala Lumpur" },
            { questionId: "first_school", answer: "Alice Smith School" },
            { questionId: "favorite_book", answer: "Surely You're Joking, Mr. Feynman" },
            { questionId: "childhood_nickname", answer: "Ash" },
        ],
    },
    {
        email: "daniel.kim@candidate.edu.au",
        firstName: "Daniel",
        lastName: "Kim",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Seoul" },
            { questionId: "first_school", answer: "Seoul Science High School" },
            { questionId: "favorite_book", answer: "Deep Learning" },
            { questionId: "childhood_nickname", answer: "Dan" },
        ],
    },
    {
        email: "chloe.martin@candidate.edu.au",
        firstName: "Chloe",
        lastName: "Martin",
        honorific: "Ms.",
        securityAnswers: [
            { questionId: "birth_city", answer: "Auckland" },
            { questionId: "first_school", answer: "Epsom Girls Grammar School" },
            { questionId: "favorite_book", answer: "Contagious" },
            { questionId: "childhood_nickname", answer: "Clo" },
        ],
    },
    {
        email: "oscar.silva@candidate.edu.au",
        firstName: "Oscar",
        lastName: "Silva",
        honorific: "Mr.",
        securityAnswers: [
            { questionId: "birth_city", answer: "São Paulo" },
            { questionId: "first_school", answer: "Colégio Bandeirantes" },
            { questionId: "favorite_book", answer: "The Goal" },
            { questionId: "childhood_nickname", answer: "Ossie" },
        ],
    },
];

/** Additional lecturer–course links for the expanded team. */
export const EXTRA_COURSE_ASSIGNMENTS: Array<{
    courseCode: string;
    lecturerEmail: string;
}> = [
    ...WAVE_2_COURSE_ASSIGNMENTS,
    { courseCode: "MARK1001", lecturerEmail: "elena.voss@lecturer.edu.au" },
    { courseCode: "ACCT5001", lecturerEmail: "elena.voss@lecturer.edu.au" },
    { courseCode: "INTE2400", lecturerEmail: "noah.fischer@lecturer.edu.au" },
    { courseCode: "COSC2123", lecturerEmail: "noah.fischer@lecturer.edu.au" },
    { courseCode: "ENGG1300", lecturerEmail: "rachel.okonkwo@lecturer.edu.au" },
    { courseCode: "PHYS1161", lecturerEmail: "rachel.okonkwo@lecturer.edu.au" },
    { courseCode: "COMP9417", lecturerEmail: "wei.zhang@lecturer.edu.au" },
    { courseCode: "COMP9001", lecturerEmail: "wei.zhang@lecturer.edu.au" },
];

export type InteractionStep =
    | { kind: "lecturer_message"; lecturerEmail: string; body: string }
    | { kind: "candidate_message"; body: string; replyToLecturer?: boolean }
    | { kind: "shortlist_and_rank"; lecturerEmail: string }
    | { kind: "select"; lecturerEmail: string }
    | { kind: "reject"; lecturerEmail: string }
    | { kind: "withdraw" }
    | { kind: "offer_accept" }
    | { kind: "offer_decline" }
    | {
          kind: "react_last_lecturer";
          by: "candidate" | "lecturer";
          emoji: string;
      }
    | {
          kind: "react_last_candidate";
          by: "candidate" | "lecturer";
          emoji: string;
      };

export type ApplicationScenario = {
    candidateEmail: string;
    courseCode: string;
    roleName: "tutor" | "lab_assistant";
    availability: "Part Time" | "Full Time";
    skills: string;
    experience: string;
    motivation: string;
    appliedDaysAgo: number;
    steps: InteractionStep[];
};

const BASE_APPLICATION_SCENARIOS: ApplicationScenario[] = [
    {
        candidateEmail: "alex.nguyen@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        availability: "Part Time",
        skills: "React, TypeScript, Node.js, PostgreSQL",
        experience: "Led a faculty web project team for two semesters.",
        motivation:
            "I want to support students building full-stack projects with modern tooling.",
        appliedDaysAgo: 12,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "jane.morrison@lecturer.edu.au",
                body: "Your stack aligns well with the course. Which tutorial times are you available?",
            },
            {
                kind: "candidate_message",
                body: "I am available Tuesday and Thursday afternoons.",
                replyToLecturer: true,
            },
            {
                kind: "lecturer_message",
                lecturerEmail: "jane.morrison@lecturer.edu.au",
                body: "Tuesday 2–4pm works. I will shortlist you for ranking.",
            },
            { kind: "shortlist_and_rank", lecturerEmail: "jane.morrison@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "samira.patel@candidate.edu.au",
        courseCode: "COMP9417",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Python, scikit-learn, pandas, model evaluation",
        experience: "Research assistant on a tabular ML benchmarking study.",
        motivation:
            "I enjoy helping students connect theory to practical model-building labs.",
        appliedDaysAgo: 9,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "marcus.chen@lecturer.edu.au",
                body: "Please outline how you would run a tutorial on cross-validation.",
            },
            {
                kind: "candidate_message",
                body: "I would start with a small dataset, split folds live, and compare metrics on the board.",
                replyToLecturer: true,
            },
            { kind: "shortlist_and_rank", lecturerEmail: "marcus.chen@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "james.oconnor@candidate.edu.au",
        courseCode: "MATH1131",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Calculus, linear algebra, problem-set coaching",
        experience: "PASS leader for first-year mathematics.",
        motivation:
            "I want to help students build confidence with rigorous weekly problem sets.",
        appliedDaysAgo: 14,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "priya.sharma@lecturer.edu.au",
                body: "Strong PASS background. Please confirm you can cover integration techniques.",
            },
            {
                kind: "candidate_message",
                body: "Yes — substitution, parts, and partial fractions are areas I have tutored before.",
                replyToLecturer: true,
            },
            { kind: "shortlist_and_rank", lecturerEmail: "priya.sharma@lecturer.edu.au" },
            { kind: "select", lecturerEmail: "priya.sharma@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "alex.nguyen@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "lab_assistant",
        availability: "Part Time",
        skills: "C++, debugging, complexity analysis",
        experience: "Algorithms study group facilitator.",
        motivation: "I would like to support students in weekly algorithm labs.",
        appliedDaysAgo: 6,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "noah.fischer@lecturer.edu.au",
                body: "Thanks for applying. Have you used gdb or Valgrind in teaching support before?",
            },
        ],
    },
    {
        candidateEmail: "mia.tan@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        availability: "Full Time",
        skills: "Docker, Linux, CI pipelines, Git workflows",
        experience: "DevOps intern supporting student project deployments.",
        motivation:
            "Lab support for deployment and environment setup is where I can add the most value.",
        appliedDaysAgo: 8,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "marcus.chen@lecturer.edu.au",
                body: "Your DevOps experience is relevant. Can you run evening lab support?",
            },
            {
                kind: "candidate_message",
                body: "Yes, Wednesday and Friday evenings work for me.",
                replyToLecturer: true,
            },
            { kind: "shortlist_and_rank", lecturerEmail: "marcus.chen@lecturer.edu.au" },
            { kind: "select", lecturerEmail: "jane.morrison@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "samira.patel@candidate.edu.au",
        courseCode: "BUSM1001",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Excel, SQL, Tableau, stakeholder communication",
        experience: "Analytics club workshop facilitator.",
        motivation:
            "I want to coach students through real business case analyses.",
        appliedDaysAgo: 11,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "marcus.chen@lecturer.edu.au",
                body: "Please share an example dashboard you have built for coursework.",
            },
            {
                kind: "candidate_message",
                body: "I built a retail sales dashboard in Tableau with cohort filters and YoY comparisons.",
                replyToLecturer: true,
            },
            { kind: "shortlist_and_rank", lecturerEmail: "marcus.chen@lecturer.edu.au" },
            { kind: "select", lecturerEmail: "marcus.chen@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "liam.carter@candidate.edu.au",
        courseCode: "BUSM1001",
        roleName: "lab_assistant",
        availability: "Part Time",
        skills: "SQL, spreadsheet modelling, data cleaning",
        experience: "Peer mentor in introductory business analytics.",
        motivation: "I can help students complete structured lab exercises on time.",
        appliedDaysAgo: 7,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "elena.voss@lecturer.edu.au",
                body: "Good fit for lab support. I have added you to the shortlist.",
            },
            { kind: "shortlist_and_rank", lecturerEmail: "elena.voss@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "aisha.rahman@candidate.edu.au",
        courseCode: "PHYS1161",
        roleName: "lab_assistant",
        availability: "Part Time",
        skills: "Mechanics, MATLAB, experimental write-ups",
        experience: "Physics outreach lab volunteer.",
        motivation: "I enjoy guiding students through mechanics experiments.",
        appliedDaysAgo: 10,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "rachel.okonkwo@lecturer.edu.au",
                body: "Could you assist with the projectile motion practical next month?",
            },
            {
                kind: "candidate_message",
                body: "Absolutely — I have run a similar station at an outreach day.",
                replyToLecturer: true,
            },
        ],
    },
    {
        candidateEmail: "daniel.kim@candidate.edu.au",
        courseCode: "COMP9001",
        roleName: "tutor",
        availability: "Full Time",
        skills: "Academic writing, LaTeX, literature review methods",
        experience: "Thesis formatting assistant at the writing centre.",
        motivation:
            "Graduate research workshops are where I can support new researchers most.",
        appliedDaysAgo: 13,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "wei.zhang@lecturer.edu.au",
                body: "Thank you for applying. The cohort is full for this intake.",
            },
            { kind: "reject", lecturerEmail: "wei.zhang@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "chloe.martin@candidate.edu.au",
        courseCode: "MARK1001",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Campaign planning, consumer research, presentation coaching",
        experience: "Marketing society case-competition coach.",
        motivation:
            "I want to help students translate research insights into campaign briefs.",
        appliedDaysAgo: 4,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "elena.voss@lecturer.edu.au",
                body: "Please confirm availability for the first tutorial week.",
            },
        ],
    },
    {
        candidateEmail: "oscar.silva@candidate.edu.au",
        courseCode: "ENGG1300",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Project management, technical communication, CAD basics",
        experience: "Engineering studio team lead.",
        motivation:
            "Studio facilitation matches my experience coordinating multidisciplinary teams.",
        appliedDaysAgo: 5,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "rachel.okonkwo@lecturer.edu.au",
                body: "Your studio experience looks relevant. Are you still interested this semester?",
            },
            {
                kind: "candidate_message",
                body: "I need to withdraw — my internship hours changed. Thank you for considering me.",
                replyToLecturer: true,
            },
            { kind: "withdraw" },
        ],
    },
    {
        candidateEmail: "oscar.silva@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Algorithms, peer teaching, C++",
        experience: "Competitive programming club mentor.",
        motivation: "I would like to tutor algorithms problem-solving sessions.",
        appliedDaysAgo: 3,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "noah.fischer@lecturer.edu.au",
                body: "Share how you would structure a tutorial on graph traversal.",
            },
            {
                kind: "candidate_message",
                body: "BFS and DFS on the whiteboard, then a paired exercise on grid graphs.",
                replyToLecturer: true,
            },
        ],
    },
    {
        candidateEmail: "mia.tan@candidate.edu.au",
        courseCode: "ISYS9001",
        roleName: "tutor",
        availability: "Part Time",
        skills: "ERP concepts, process mapping, integration testing",
        experience: "Enterprise systems capstone project.",
        motivation: "I can help students connect ERP theory to integration labs.",
        appliedDaysAgo: 2,
        steps: [],
    },
    {
        candidateEmail: "liam.carter@candidate.edu.au",
        courseCode: "INTE2400",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Routing, switching, subnetting, packet analysis",
        experience: "Network operations summer internship.",
        motivation: "Network labs need tutors who are comfortable with live configuration.",
        appliedDaysAgo: 6,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "noah.fischer@lecturer.edu.au",
                body: "Can you support the VLAN lab and troubleshooting clinic?",
            },
            { kind: "shortlist_and_rank", lecturerEmail: "noah.fischer@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "daniel.kim@candidate.edu.au",
        courseCode: "COMP9417",
        roleName: "lab_assistant",
        availability: "Part Time",
        skills: "TensorFlow, Python, GPU lab setup",
        experience: "ML reading group organiser.",
        motivation: "I want to help students debug training pipelines in lab sessions.",
        appliedDaysAgo: 8,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "wei.zhang@lecturer.edu.au",
                body: "Useful ML lab background. I will add you to the ranking list.",
            },
            { kind: "shortlist_and_rank", lecturerEmail: "wei.zhang@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "aisha.rahman@candidate.edu.au",
        courseCode: "MATH1131",
        roleName: "lab_assistant",
        availability: "Full Time",
        skills: "MATLAB, numerical methods, lab safety",
        experience: "Engineering mathematics help desk.",
        motivation: "I can support MATLAB-based calculus labs each week.",
        appliedDaysAgo: 1,
        steps: [],
    },
    {
        candidateEmail: "james.oconnor@candidate.edu.au",
        courseCode: "ENGG1300",
        roleName: "lab_assistant",
        availability: "Part Time",
        skills: "Workshop tools, safety inductions, 3D printing",
        experience: "Maker space volunteer.",
        motivation: "Hands-on studio support is where I work best.",
        appliedDaysAgo: 15,
        steps: [
            {
                kind: "lecturer_message",
                lecturerEmail: "priya.sharma@lecturer.edu.au",
                body: "We have selected other applicants for this role. Thank you for applying.",
            },
            { kind: "reject", lecturerEmail: "priya.sharma@lecturer.edu.au" },
        ],
    },
    {
        candidateEmail: "chloe.martin@candidate.edu.au",
        courseCode: "ACCT5001",
        roleName: "tutor",
        availability: "Part Time",
        skills: "Financial reporting, Excel modelling, case discussion",
        experience: "Accounting peer study leader.",
        motivation: "I would like to run revision tutorials for postgraduate accounting.",
        appliedDaysAgo: 20,
        steps: [],
    },
];

const APPLICATION_SCENARIOS: ApplicationScenario[] = [
    ...BASE_APPLICATION_SCENARIOS,
    ...WAVE_2_APPLICATION_SCENARIOS,
];

function addReaction(
    application: Application,
    messageId: string,
    userId: number,
    emoji: string
): void {
    const reactions =
        application.messageReactions && typeof application.messageReactions === "object"
            ? { ...application.messageReactions }
            : {};
    const byEmoji =
        reactions[messageId] && typeof reactions[messageId] === "object"
            ? { ...reactions[messageId] }
            : {};
    const existing = Array.isArray(byEmoji[emoji]) ? [...byEmoji[emoji]] : [];
    if (!existing.includes(userId)) {
        existing.push(userId);
    }
    byEmoji[emoji] = existing;
    reactions[messageId] = byEmoji;
    application.messageReactions = reactions;
}

function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() - days);
    return d;
}

function shiftCorrespondenceAfterApplied(
    application: Application,
    appliedAt: Date
): void {
    const appliedMs = appliedAt.getTime();
    const messages = getCorrespondenceMessages(application);
    let offsetMs = 45 * 60 * 1000;

    for (const message of messages) {
        message.createdAt = new Date(appliedMs + offsetMs).toISOString();
        offsetMs += 50 * 60 * 1000;
    }

    application.correspondenceMessages = messages;
    syncLegacyCorrespondenceFields(application, messages);

    if (application.commentedAt) {
        const lecturerMessages = messages.filter(
            (m) => m.authorRole === "lecturer" && !m.deletedAt
        );
        const latest = lecturerMessages[lecturerMessages.length - 1];
        if (latest) {
            application.commentedAt = new Date(latest.createdAt);
        }
    }
    if (application.candidateRespondedAt) {
        const candidateMessages = messages.filter(
            (m) => m.authorRole === "candidate" && !m.deletedAt
        );
        const latest = candidateMessages[candidateMessages.length - 1];
        if (latest) {
            application.candidateRespondedAt = new Date(latest.createdAt);
        }
    }
    if (application.reviewedAt && application.commentedAt) {
        application.reviewedAt = application.commentedAt;
    }
}

export async function assignExtraCourseLecturers(
    courseByCode: Map<string, Course>,
    lecturerByEmail: Map<string, User>
): Promise<void> {
    const assignmentRepo = AppDataSource.getRepository(CourseAssignment);

    for (const { courseCode, lecturerEmail } of EXTRA_COURSE_ASSIGNMENTS) {
        const course = courseByCode.get(courseCode);
        const lecturer = lecturerByEmail.get(lecturerEmail);
        if (!course || !lecturer) continue;

        const exists = await assignmentRepo.findOne({
            where: { courseId: course.id, lecturerId: lecturer.id },
        });
        if (exists) continue;

        await assignmentRepo.save(
            assignmentRepo.create({
                courseId: course.id,
                lecturerId: lecturer.id,
            })
        );
    }
}

export async function seedApplicationInteractions(
    lecturerByEmail: Map<string, User>,
    candidateByEmail: Map<string, User>,
    courseByCode: Map<string, Course>,
    tutorRole: Role,
    labRole: Role
): Promise<void> {
    const applicationRepo = AppDataSource.getRepository(Application);
    const selectedRepo = AppDataSource.getRepository(SelectedCandidate);
    const rankByCourse = new Map<string, number>();
    const now = new Date();

    const nextRank = (courseCode: string): number => {
        const next = (rankByCourse.get(courseCode) ?? 0) + 1;
        rankByCourse.set(courseCode, next);
        return next;
    };

    for (const scenario of APPLICATION_SCENARIOS) {
        const candidate = candidateByEmail.get(scenario.candidateEmail);
        const course = courseByCode.get(scenario.courseCode);
        if (!candidate || !course) continue;

        const role = scenario.roleName === "tutor" ? tutorRole : labRole;
        const appliedAt = addDays(now, scenario.appliedDaysAgo);

        let application = applicationRepo.create({
            candidateId: candidate.id,
            courseId: course.id,
            roleId: role.id,
            status: ApplicationStatus.PENDING,
            appliedAt,
            availability: { type: scenario.availability },
            skills: scenario.skills,
            experience: scenario.experience,
            motivation: scenario.motivation,
            isWithdrawn: false,
        } as DeepPartial<Application>);

        application = await applicationRepo.save(application);

        let lastLecturerMessageId: string | null = null;
        let lastLecturerUserId: number | null = null;
        let lastCandidateMessageId: string | null = null;

        for (const step of scenario.steps) {
            if (step.kind === "lecturer_message") {
                const lecturer = lecturerByEmail.get(step.lecturerEmail);
                if (!lecturer) continue;
                const message = appendLecturerMessage(
                    application,
                    lecturer.id,
                    step.body
                );
                lastLecturerMessageId = message.id;
                lastLecturerUserId = lecturer.id;
            }

            if (step.kind === "candidate_message") {
                const replyTo = step.replyToLecturer
                    ? lastLecturerMessageId
                    : null;
                const message = appendCandidateMessage(
                    application,
                    candidate.id,
                    step.body,
                    replyTo
                );
                lastCandidateMessageId = message.id;
            }

            if (step.kind === "react_last_lecturer" && lastLecturerMessageId) {
                const reactorId =
                    step.by === "candidate"
                        ? candidate.id
                        : lastLecturerUserId;
                if (reactorId) {
                    addReaction(
                        application,
                        lastLecturerMessageId,
                        reactorId,
                        step.emoji
                    );
                }
            }

            if (step.kind === "react_last_candidate" && lastCandidateMessageId) {
                const reactorId =
                    step.by === "candidate"
                        ? candidate.id
                        : lastLecturerUserId;
                if (reactorId) {
                    addReaction(
                        application,
                        lastCandidateMessageId,
                        reactorId,
                        step.emoji
                    );
                }
            }

            if (step.kind === "shortlist_and_rank") {
                const lecturer = lecturerByEmail.get(step.lecturerEmail);
                if (!lecturer) continue;

                const existing = await selectedRepo.findOne({
                    where: { applicationId: application.id },
                });
                if (!existing) {
                    await selectedRepo.save(
                        selectedRepo.create({
                            applicationId: application.id,
                            selectedById: lecturer.id,
                        })
                    );
                }

                if (!application.rank || application.rank <= 0) {
                    application.rank = nextRank(scenario.courseCode);
                    application.rankedForCourse = scenario.courseCode;
                    application.rankedBy = lecturer.id;
                    application.rankedAt = new Date();
                }
            }

            if (step.kind === "select") {
                const lecturer = lecturerByEmail.get(step.lecturerEmail);
                if (!lecturer) continue;

                const shortlisted = await selectedRepo.findOne({
                    where: { applicationId: application.id },
                });
                if (
                    !shortlisted ||
                    !application.rank ||
                    application.rank <= 0 ||
                    application.rankedForCourse !== scenario.courseCode
                ) {
                    continue;
                }

                const selectedCount = await countActiveSelectedForRole(
                    applicationRepo,
                    course.id,
                    scenario.roleName
                );
                const maxSlots =
                    scenario.roleName === "tutor"
                        ? course.maxTutors
                        : course.maxLabAssistants;

                if (selectedCount < maxSlots) {
                    application.status = ApplicationStatus.SELECTED;
                    if (!application.offerResponse) {
                        application.offerResponse = OfferResponse.PENDING;
                    }
                }
            }

            if (step.kind === "reject") {
                application.status = ApplicationStatus.REJECTED;
            }

            if (step.kind === "withdraw") {
                application.isWithdrawn = true;
                application.withdrawnAt = new Date();
            }

            if (step.kind === "offer_accept") {
                application.offerResponse = OfferResponse.ACCEPTED;
                application.offerRespondedAt = new Date();
            }

            if (step.kind === "offer_decline") {
                application.offerResponse = OfferResponse.DECLINED;
                application.offerRespondedAt = new Date();
            }
        }

        shiftCorrespondenceAfterApplied(application, appliedAt);
        await applicationRepo.save(application);
    }

    await NotificationService.backfillFromApplications();
}
