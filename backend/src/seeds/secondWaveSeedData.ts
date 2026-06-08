import { ApplicationStatus } from "../entities/Application";
import type {
    ExtraApplicationDef,
    ExtraCandidateDef,
    ExtraCourseDef,
} from "./extendedSeedData";

/** Second wave — doubles dataset size when merged with extendedSeedData. */

export const WAVE2_LECTURERS = [
    {
        email: "olivia.lecturer@lecturer.edu.au",
        firstName: "Olivia",
        lastName: "Grant",
        honorific: "Dr.",
    },
    {
        email: "theo.lecturer@lecturer.edu.au",
        firstName: "Theo",
        lastName: "Banks",
        honorific: "Prof.",
    },
    {
        email: "nina.lecturer@lecturer.edu.au",
        firstName: "Nina",
        lastName: "Kowalski",
        honorific: "Dr.",
    },
    {
        email: "leo.lecturer@lecturer.edu.au",
        firstName: "Leo",
        lastName: "Murphy",
        honorific: "Dr.",
    },
] as const;

export const WAVE2_CANDIDATES: ExtraCandidateDef[] = [
    { email: "taylor.reed@candidate.edu.au", firstName: "Taylor", lastName: "Reed", honorific: "Mx." },
    { email: "cameron.candidate@candidate.edu.au", firstName: "Cameron", lastName: "Hayes", honorific: "Mr." },
    { email: "devon.candidate@candidate.edu.au", firstName: "Devon", lastName: "Price", honorific: "Ms." },
    { email: "harper.candidate@candidate.edu.au", firstName: "Harper", lastName: "Liu", honorific: "Ms." },
    { email: "finley.candidate@candidate.edu.au", firstName: "Finley", lastName: "Brooks", honorific: "Mr." },
    { email: "sage.candidate@candidate.edu.au", firstName: "Sage", lastName: "Morris", honorific: "Mx." },
    { email: "rowan.candidate@candidate.edu.au", firstName: "Rowan", lastName: "Davis", honorific: "Mr.", isBlocked: true },
    { email: "emery.candidate@candidate.edu.au", firstName: "Emery", lastName: "Cole", honorific: "Ms." },
    { email: "phoenix.candidate@candidate.edu.au", firstName: "Phoenix", lastName: "Ward", honorific: "Mr." },
    { email: "river.candidate@candidate.edu.au", firstName: "River", lastName: "Stone", honorific: "Mx." },
];

export const WAVE2_COURSE_DEFS: ExtraCourseDef[] = [
    {
        courseCode: "PHYS1010",
        courseName: "Physics Fundamentals",
        semester: "Semester 2 2026",
        description: "Mechanics and thermodynamics labs",
        maxTutors: 3,
        maxLabAssistants: 2,
        deadlineDays: 40,
        lecturerEmails: ["olivia.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "MATH2011",
        courseName: "Linear Algebra",
        semester: "Semester 2 2026",
        description: "Vector spaces and eigenvalues",
        maxTutors: 4,
        maxLabAssistants: 0,
        deadlineDays: 22,
        lecturerEmails: ["olivia.lecturer@lecturer.edu.au", "theo.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "INFO3003",
        courseName: "Cloud Computing",
        semester: "Semester 2 2026",
        description: "AWS, containers, serverless",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 15,
        lecturerEmails: ["theo.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "GAME2001",
        courseName: "Game Design Studio",
        semester: "Semester 2 2026",
        description: "Unity prototypes and playtesting",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 28,
        lecturerEmails: ["nina.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "ARTS1500",
        courseName: "Digital Media Production",
        semester: "Semester 2 2026",
        description: "Video editing and motion graphics",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: 35,
        lecturerEmails: ["nina.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "NURS1102",
        courseName: "Clinical Skills",
        semester: "Semester 2 2026",
        description: "Simulation labs and patient care",
        maxTutors: 3,
        maxLabAssistants: 3,
        deadlineDays: 10,
        lecturerEmails: ["leo.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "PSYC1001",
        courseName: "Introduction to Psychology",
        semester: "Semester 2 2026",
        description: "Research methods workshops",
        maxTutors: 5,
        maxLabAssistants: 0,
        deadlineDays: 50,
        lecturerEmails: ["leo.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "ARCH2005",
        courseName: "Architectural Drawing",
        semester: "Semester 2 2026",
        description: "CAD and model-making studios",
        maxTutors: 2,
        maxLabAssistants: 1,
        deadlineDays: 6,
        lecturerEmails: ["olivia.lecturer@lecturer.edu.au", "leo.lecturer@lecturer.edu.au"],
    },
];

const WAVE2_SKILLS = [
    "Physics, calculus, lab reports",
    "Linear algebra, MATLAB",
    "Docker, Kubernetes, AWS",
    "Unity, C#, game loops",
    "Premiere, After Effects",
    "Clinical simulation, CPR",
    "SPSS, research ethics",
    "AutoCAD, Rhino 3D",
];

export function buildSecondWaveApplications(): ExtraApplicationDef[] {
    const statuses = [
        ApplicationStatus.PENDING,
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
    ] as const;
    const roles = ["tutor", "lab_assistant"] as const;
    const availability = ["Full Time", "Part Time"] as const;
    const lecturerPool = WAVE2_LECTURERS.map((l) => l.email);

    const apps: ExtraApplicationDef[] = [];
    let idx = 0;

    for (const candidate of WAVE2_CANDIDATES) {
        for (let i = 0; i < WAVE2_COURSE_DEFS.length; i++) {
            const course = WAVE2_COURSE_DEFS[i];
            const status = statuses[(idx + i) % statuses.length];
            const roleName = roles[(idx + i) % roles.length];
            const lecturerEmail = lecturerPool[(idx + i) % lecturerPool.length];

            apps.push({
                candidateEmail: candidate.email,
                courseCode: course.courseCode,
                roleName,
                status,
                availability: availability[(idx + i) % availability.length],
                skills: WAVE2_SKILLS[(idx + i) % WAVE2_SKILLS.length],
                experience: `${1 + ((idx + i) % 5)} years tutoring experience.`,
                motivation: "Wave-2 seed application for expanded demo dataset.",
                lecturerEmail,
                lecturerComment:
                    status === ApplicationStatus.PENDING
                        ? "Wave 2 — confirm lab availability."
                        : status === ApplicationStatus.SELECTED
                          ? "Wave 2 — excellent fit."
                          : "Wave 2 — not selected this round.",
                candidateReply:
                    status !== ApplicationStatus.REJECTED
                        ? "Available for evening sessions."
                        : undefined,
                isWithdrawn:
                    status === ApplicationStatus.REJECTED && (idx + i) % 4 === 0,
            });
            idx++;
        }
    }

    const wave2CourseCodes = new Set(WAVE2_COURSE_DEFS.map((c) => c.courseCode));
    const crossCourses = ["COSC2758", "COMP9417", "STAT2001", "PHYS1010", "INFO3003"].filter(
        (code) => !wave2CourseCodes.has(code)
    );
    for (const candidate of WAVE2_CANDIDATES.slice(0, 7)) {
        for (const courseCode of crossCourses) {
            apps.push({
                candidateEmail: candidate.email,
                courseCode,
                roleName: "tutor",
                status: ApplicationStatus.PENDING,
                availability: "Part Time",
                skills: "Wave-2 cross-faculty application.",
                experience: "Peer mentor.",
                motivation: "Build cross-disciplinary teaching experience.",
                lecturerEmail: "olivia.lecturer@lecturer.edu.au",
                lecturerComment: "Second-wave cross-list demo thread.",
            });
        }
    }

    return apps;
}
