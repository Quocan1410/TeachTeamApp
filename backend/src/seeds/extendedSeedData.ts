import { ApplicationStatus } from "../entities/Application";

export type ExtraCandidateDef = {
    email: string;
    firstName: string;
    lastName: string;
    honorific: string;
    isBlocked?: boolean;
};

export type ExtraCourseDef = {
    courseCode: string;
    courseName: string;
    semester: string;
    description: string;
    maxTutors: number;
    maxLabAssistants: number;
    deadlineDays: number;
    lecturerEmails: readonly string[];
};

export type ExtraApplicationDef = {
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
    candidateReplyToMessageId?: string;
    rank?: number;
    rankedForCourse?: string;
    reactionSeed?: Array<{
        messageId?: string;
        emoji: string;
        actors: Array<"candidate" | "lecturer">;
    }>;
    extraMessages?: Array<{
        id: string;
        authorRole: "candidate" | "lecturer";
        body: string;
        replyToMessageId?: string;
    }>;
};

export const EXTRA_LECTURERS = [
    {
        email: "elena.lecturer@lecturer.edu.au",
        firstName: "Elena",
        lastName: "Voss",
        honorific: "Dr.",
    },
    {
        email: "noah.lecturer@lecturer.edu.au",
        firstName: "Noah",
        lastName: "Fischer",
        honorific: "Prof.",
    },
] as const;

export const EXTRA_CANDIDATES: ExtraCandidateDef[] = [
    {
        email: "jamie.candidate@candidate.edu.au",
        firstName: "Jamie",
        lastName: "Olsen",
        honorific: "Mr.",
    },
    {
        email: "morgan.candidate@candidate.edu.au",
        firstName: "Morgan",
        lastName: "Lee",
        honorific: "Ms.",
    },
    {
        email: "casey.candidate@candidate.edu.au",
        firstName: "Casey",
        lastName: "Wright",
        honorific: "Mx.",
    },
    {
        email: "jordan.candidate@candidate.edu.au",
        firstName: "Jordan",
        lastName: "Singh",
        honorific: "Mr.",
    },
    {
        email: "avery.candidate@candidate.edu.au",
        firstName: "Avery",
        lastName: "Brown",
        honorific: "Ms.",
        isBlocked: true,
    },
    {
        email: "quinn.candidate@candidate.edu.au",
        firstName: "Quinn",
        lastName: "Martinez",
        honorific: "Mr.",
    },
    {
        email: "drew.candidate@candidate.edu.au",
        firstName: "Drew",
        lastName: "Nguyen",
        honorific: "Mr.",
    },
    {
        email: "skyler.candidate@candidate.edu.au",
        firstName: "Skyler",
        lastName: "Adams",
        honorific: "Ms.",
    },
    {
        email: "reese.candidate@candidate.edu.au",
        firstName: "Reese",
        lastName: "Clark",
        honorific: "Mr.",
    },
    {
        email: "blake.candidate@candidate.edu.au",
        firstName: "Blake",
        lastName: "Turner",
        honorific: "Ms.",
    },
];

export const EXTRA_COURSE_DEFS: ExtraCourseDef[] = [
    {
        courseCode: "STAT2001",
        courseName: "Probability and Statistics",
        semester: "Semester 2 2026",
        description: "Introductory statistics for CS students",
        maxTutors: 3,
        maxLabAssistants: 1,
        deadlineDays: 45,
        lecturerEmails: ["elena.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "DATA3002",
        courseName: "Data Visualisation",
        semester: "Semester 2 2026",
        description: "Dashboards, D3, storytelling with data",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 25,
        lecturerEmails: ["elena.lecturer@lecturer.edu.au", "marcus.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "CYBR1001",
        courseName: "Cybersecurity Fundamentals",
        semester: "Semester 2 2026",
        description: "Threat modelling and secure coding labs",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 18,
        lecturerEmails: ["noah.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "DESN2000",
        courseName: "UX Design Studio",
        semester: "Semester 2 2026",
        description: "Wireframes, usability testing, portfolios",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: 32,
        lecturerEmails: ["noah.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "CHEM1011",
        courseName: "Chemistry 1A",
        semester: "Semester 2 2026",
        description: "General chemistry with lab component",
        maxTutors: 3,
        maxLabAssistants: 3,
        deadlineDays: -5,
        lecturerEmails: ["priya.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "BIOL1002",
        courseName: "Cell Biology",
        semester: "Semester 2 2026",
        description: "Microscopy and cell culture labs",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 12,
        lecturerEmails: ["priya.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "ECON1101",
        courseName: "Microeconomics",
        semester: "Semester 2 2026",
        description: "Markets, elasticity, welfare",
        maxTutors: 4,
        maxLabAssistants: 0,
        deadlineDays: 55,
        lecturerEmails: ["david.lecturer@lecturer.edu.au"],
    },
    {
        courseCode: "LAWS1001",
        courseName: "Legal Research Methods",
        semester: "Semester 2 2026",
        description: "Case analysis and citation workshops",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: 8,
        lecturerEmails: ["david.lecturer@lecturer.edu.au"],
    },
];

const SKILL_POOL = [
    "Python, pandas, Jupyter",
    "Java, Spring, REST APIs",
    "React, TypeScript, testing",
    "Statistics, R, regression",
    "Cybersecurity, Wireshark, Linux",
    "UX research, Figma, accessibility",
    "Chemistry lab safety, titration",
    "Microbiology, sterile technique",
    "Economics modelling, Excel",
    "Legal writing, Bluebook citations",
];

const MOTIVATIONS = [
    "Support first-year students through challenging topics.",
    "Share industry experience from recent internships.",
    "Build teaching portfolio for graduate studies.",
    "Give back to the program that helped me succeed.",
    "Enjoy facilitating collaborative lab sessions.",
];

/** Bulk-generated applications across extra candidates and courses. */
export function buildExtraApplications(): ExtraApplicationDef[] {
    const statuses = [
        ApplicationStatus.PENDING,
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
    ] as const;
    const roles = ["tutor", "lab_assistant"] as const;
    const availability = ["Full Time", "Part Time"] as const;
    const lecturerPool = [
        "jane.lecturer@lecturer.edu.au",
        "marcus.lecturer@lecturer.edu.au",
        "priya.lecturer@lecturer.edu.au",
        "david.lecturer@lecturer.edu.au",
        "elena.lecturer@lecturer.edu.au",
        "noah.lecturer@lecturer.edu.au",
    ];

    const apps: ExtraApplicationDef[] = [];
    let skillIdx = 0;

    for (const candidate of EXTRA_CANDIDATES) {
        for (let i = 0; i < EXTRA_COURSE_DEFS.length; i++) {
            const course = EXTRA_COURSE_DEFS[i];
            const status = statuses[(skillIdx + i) % statuses.length];
            const roleName = roles[(skillIdx + i) % roles.length];
            const lecturerEmail = lecturerPool[(skillIdx + i) % lecturerPool.length];

            apps.push({
                candidateEmail: candidate.email,
                courseCode: course.courseCode,
                roleName,
                status,
                availability: availability[(skillIdx + i) % availability.length],
                skills: SKILL_POOL[(skillIdx + i) % SKILL_POOL.length],
                experience: `${2 + ((skillIdx + i) % 4)} semesters peer support.`,
                motivation: MOTIVATIONS[(skillIdx + i) % MOTIVATIONS.length],
                lecturerEmail:
                    status !== ApplicationStatus.PENDING
                        ? lecturerEmail
                        : lecturerEmail,
                lecturerComment:
                    status === ApplicationStatus.PENDING
                        ? "Please confirm your weekly availability."
                        : status === ApplicationStatus.SELECTED
                          ? "Strong application — welcome to the team."
                          : "Thank you for applying this round.",
                candidateReply:
                    status === ApplicationStatus.PENDING
                        ? "Happy to tutor on weekday afternoons."
                        : status === ApplicationStatus.SELECTED
                          ? "Thank you — looking forward to working with the team."
                          : undefined,
                candidateReplyToMessageId:
                    status !== ApplicationStatus.REJECTED
                        ? "msg-lecturer-primary"
                        : undefined,
                rank:
                    status === ApplicationStatus.SELECTED &&
                    (skillIdx + i) % 3 === 0
                        ? 1 + ((skillIdx + i) % 3)
                        : undefined,
                rankedForCourse:
                    status === ApplicationStatus.SELECTED &&
                    (skillIdx + i) % 3 === 0
                        ? course.courseCode
                        : undefined,
                reactionSeed:
                    status !== ApplicationStatus.REJECTED &&
                    (skillIdx + i) % 4 === 0
                        ? [
                              {
                                  emoji: "👍",
                                  actors: ["candidate", "lecturer"] as Array<
                                      "candidate" | "lecturer"
                                  >,
                              },
                          ]
                        : undefined,
                isWithdrawn:
                    status === ApplicationStatus.REJECTED &&
                    (skillIdx + i) % 5 === 0,
            });
            skillIdx++;
        }
    }

    // Cross-applications onto original courses for pagination/search diversity
    const legacyCourses = ["COSC2758", "COMP9417", "MATH1131", "ISYS9001"];
    for (const candidate of EXTRA_CANDIDATES.slice(0, 6)) {
        for (const courseCode of legacyCourses) {
            apps.push({
                candidateEmail: candidate.email,
                courseCode,
                roleName: "tutor",
                status: ApplicationStatus.PENDING,
                availability: "Part Time",
                skills: "Cross-listed demo application for search tests.",
                experience: "Hackathon mentor.",
                motivation: "Expand teaching experience across faculties.",
                lecturerEmail: "jane.lecturer@lecturer.edu.au",
                lecturerComment: "Demo thread for extended seed dataset.",
            });
        }
    }

    return apps;
}
