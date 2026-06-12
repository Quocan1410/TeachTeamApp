export type CourseSeedDef = {
    courseCode: string;
    courseName: string;
    semester: string;
    description: string;
    maxTutors: number;
    maxLabAssistants: number;
    deadlineDays: number;
    lecturerEmails: string[];
};

export const WAVE_2_COURSES: CourseSeedDef[] = [
    {
        courseCode: "LAWS1001",
        courseName: "Introduction to Law",
        semester: "Semester 2 2026",
        description:
            "Legal reasoning, case analysis, and foundational concepts in Australian common law.",
        maxTutors: 2,
        maxLabAssistants: 0,
        deadlineDays: 28,
        lecturerEmails: ["hannah.walsh@lecturer.edu.au", "elena.voss@lecturer.edu.au"],
    },
    {
        courseCode: "BIOL1001",
        courseName: "Cell Biology",
        semester: "Semester 2 2026",
        description:
            "Cell structure, metabolism, genetics, and microscopy techniques for life sciences.",
        maxTutors: 2,
        maxLabAssistants: 3,
        deadlineDays: 36,
        lecturerEmails: ["tomas.rivera@lecturer.edu.au", "rachel.okonkwo@lecturer.edu.au"],
    },
    {
        courseCode: "CHEM1011",
        courseName: "General Chemistry",
        semester: "Semester 2 2026",
        description:
            "Stoichiometry, thermodynamics, and introductory organic chemistry with weekly labs.",
        maxTutors: 2,
        maxLabAssistants: 2,
        deadlineDays: 25,
        lecturerEmails: ["yuki.nakamura@lecturer.edu.au"],
    },
    {
        courseCode: "STAT1371",
        courseName: "Statistics for Science",
        semester: "Semester 2 2026",
        description:
            "Probability, inference, and regression for science and engineering students.",
        maxTutors: 3,
        maxLabAssistants: 1,
        deadlineDays: 44,
        lecturerEmails: ["yuki.nakamura@lecturer.edu.au", "marcus.chen@lecturer.edu.au"],
    },
];

export const WAVE_2_COURSE_ASSIGNMENTS: Array<{
    courseCode: string;
    lecturerEmail: string;
}> = [
    { courseCode: "COSC2758", lecturerEmail: "yuki.nakamura@lecturer.edu.au" },
    { courseCode: "MATH1131", lecturerEmail: "hannah.walsh@lecturer.edu.au" },
    { courseCode: "COMP9417", lecturerEmail: "tomas.rivera@lecturer.edu.au" },
    { courseCode: "MARK1001", lecturerEmail: "hannah.walsh@lecturer.edu.au" },
    { courseCode: "ENGG1300", lecturerEmail: "tomas.rivera@lecturer.edu.au" },
];
