import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { Course } from "../entities/Course";
import { Role } from "../entities/Role";
import {
    Application,
    ApplicationStatus,
} from "../entities/Application";
import { SelectedCandidate } from "../entities/SelectedCandidate";
import { Notification, NotificationType } from "../entities/Notification";

const SALT_ROUNDS = 10;
export const DEV_CANDIDATE_PASSWORD = "candidate123";

export const DEV_CANDIDATES = [
    {
        email: "alice.chen@candidate.edu.au",
        firstName: "Alice",
        lastName: "Chen",
        isBlocked: false,
    },
    {
        email: "bob.nguyen@candidate.edu.au",
        firstName: "Bob",
        lastName: "Nguyen",
        isBlocked: false,
    },
    {
        email: "carla.santos@candidate.edu.au",
        firstName: "Carla",
        lastName: "Santos",
        isBlocked: false,
    },
    {
        email: "daniel.lee@candidate.edu.au",
        firstName: "Daniel",
        lastName: "Lee",
        isBlocked: false,
    },
    {
        email: "eva.patel@candidate.edu.au",
        firstName: "Eva",
        lastName: "Patel",
        isBlocked: false,
    },
    {
        email: "frank.blocked@candidate.edu.au",
        firstName: "Frank",
        lastName: "Blocked",
        isBlocked: true,
    },
    {
        email: "grace.kim@candidate.edu.au",
        firstName: "Grace",
        lastName: "Kim",
        isBlocked: false,
    },
    {
        email: "henry.wong@candidate.edu.au",
        firstName: "Henry",
        lastName: "Wong",
        isBlocked: false,
    },
    {
        email: "iris.martinez@candidate.edu.au",
        firstName: "Iris",
        lastName: "Martinez",
        isBlocked: false,
    },
    {
        email: "jack.turner@candidate.edu.au",
        firstName: "Jack",
        lastName: "Turner",
        isBlocked: false,
    },
] as const;

type DevApplicationSeed = {
    candidateEmail: string;
    courseCode: string;
    roleName: "tutor" | "lab_assistant";
    status: ApplicationStatus;
    availability: "Part Time" | "Full Time";
    skills: string;
    motivation: string;
    experience?: string;
    comment?: string;
    rank?: number;
    lecturerEmail?: string;
};

export const DEV_APPLICATIONS: DevApplicationSeed[] = [
    {
        candidateEmail: "alice.chen@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "JavaScript, React, Node.js, SQL, Git",
        motivation:
            "I want to support tutorial groups and help students build full stack projects with confidence.",
        experience: "Peer mentor for introductory programming (2024).",
    },
    {
        candidateEmail: "alice.chen@candidate.edu.au",
        courseCode: "COSC2671",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "HTML, CSS, JavaScript, debugging, lab facilitation",
        motivation:
            "I enjoy hands-on lab sessions and guiding students through web programming exercises.",
    },
    {
        candidateEmail: "bob.nguyen@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "Python, Java, algorithms, problem solving",
        motivation:
            "I am applying to gain teaching experience while completing my final year of study.",
        experience: "Volunteer coding club facilitator (2023–2024).",
    },
    {
        candidateEmail: "bob.nguyen@candidate.edu.au",
        courseCode: "COSC2938",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "TypeScript, React, Express, REST APIs",
        motivation:
            "Further web programming aligns with my career goals in software engineering.",
    },
    {
        candidateEmail: "carla.santos@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Full Time",
        skills: "React, Node.js, MySQL, teaching, communication",
        motivation:
            "I have strong results in full stack subjects and want to give back to the cohort.",
        experience: "Tutor for COSC2758 (2024 semester).",
        comment:
            "Excellent communication and reliable attendance. Recommended for priority ranking.",
        rank: 1,
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "carla.santos@candidate.edu.au",
        courseCode: "COSC2938",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Angular, TypeScript, CSS, unit testing",
        motivation:
            "I can support advanced web workshops and code reviews for students.",
        comment: "Solid technical depth and patient explanations in mock interview.",
        rank: 2,
        lecturerEmail: "sarah.johnson@lecturer.edu.au",
    },
    {
        candidateEmail: "daniel.lee@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "C++, data structures, algorithms, LaTeX",
        motivation:
            "Algorithms is my strongest area and I want to assist in lab consultations.",
    },
    {
        candidateEmail: "eva.patel@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Java, Spring, React, teamwork",
        motivation:
            "I am keen to mentor students on team projects and agile delivery practices.",
        comment: "Great leadership during group assessment marking trial.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "eva.patel@candidate.edu.au",
        courseCode: "COSC2938",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Full Time",
        skills: "Vue.js, Node.js, Docker, CI/CD basics",
        motivation:
            "I can cover modern deployment topics and support evening tutorial streams.",
        comment: "Strong DevOps awareness and clear documentation habits.",
        lecturerEmail: "sarah.johnson@lecturer.edu.au",
    },
    {
        candidateEmail: "frank.blocked@candidate.edu.au",
        courseCode: "COSC2671",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "HTML, CSS, JavaScript",
        motivation:
            "I would like to tutor web programming once my account access is restored.",
    },
    {
        candidateEmail: "grace.kim@candidate.edu.au",
        courseCode: "COSC1295",
        roleName: "lab_assistant",
        status: ApplicationStatus.SELECTED,
        availability: "Full Time",
        skills: "Java, OOP, debugging, Eclipse, IntelliJ",
        motivation:
            "Advanced programming labs suit my background in enterprise Java development.",
        comment: "Consistent lab preparation and helpful debugging walkthroughs.",
        lecturerEmail: "michael.williams@lecturer.edu.au",
    },
    {
        candidateEmail: "henry.wong@candidate.edu.au",
        courseCode: "COSC2767",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Linux, Docker, AWS, scripting, monitoring",
        motivation:
            "Systems deployment aligns with my internship in platform operations.",
    },
    {
        candidateEmail: "iris.martinez@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Algorithms, complexity analysis, Python, proofs",
        motivation:
            "I enjoy teaching algorithmic thinking and running exam preparation clinics.",
        comment: "Outstanding grades and prior PASS leader experience.",
        lecturerEmail: "sarah.johnson@lecturer.edu.au",
    },
    {
        candidateEmail: "jack.turner@candidate.edu.au",
        courseCode: "COSC2671",
        roleName: "lab_assistant",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "JavaScript, basic React",
        motivation:
            "I am building teaching experience through lab assistant roles.",
    },
];

async function upsertCandidate(userData: (typeof DEV_CANDIDATES)[number]) {
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({
        where: { email: userData.email },
    });

    if (!user) {
        const hashedPassword = await bcrypt.hash(
            DEV_CANDIDATE_PASSWORD,
            SALT_ROUNDS
        );
        user = userRepository.create({
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            userType: UserType.CANDIDATE,
            isBlocked: userData.isBlocked,
        });
    } else {
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;
        user.isBlocked = userData.isBlocked;
        user.userType = UserType.CANDIDATE;
    }

    return userRepository.save(user);
}

export async function seedDevDataset(): Promise<void> {
    if (!AppDataSource.isInitialized) {
        throw new Error("Database must be initialized before seedDevDataset");
    }

    const userRepository = AppDataSource.getRepository(User);
    const courseRepository = AppDataSource.getRepository(Course);
    const roleRepository = AppDataSource.getRepository(Role);
    const applicationRepository = AppDataSource.getRepository(Application);
    const selectionRepository = AppDataSource.getRepository(SelectedCandidate);
    const notificationRepository = AppDataSource.getRepository(Notification);

    for (const candidate of DEV_CANDIDATES) {
        await upsertCandidate(candidate);
    }

    const users = await userRepository.find();
    const courses = await courseRepository.find();
    const roles = await roleRepository.find();
    const userByEmail = new Map(users.map((u) => [u.email, u]));
    const courseByCode = new Map(courses.map((c) => [c.courseCode, c]));
    const roleByName = new Map(roles.map((r) => [r.roleName, r]));

    for (const appSeed of DEV_APPLICATIONS) {
        const candidate = userByEmail.get(appSeed.candidateEmail);
        const course = courseByCode.get(appSeed.courseCode);
        const role = roleByName.get(appSeed.roleName);
        const lecturer = appSeed.lecturerEmail
            ? userByEmail.get(appSeed.lecturerEmail)
            : undefined;

        if (!candidate || !course || !role) {
            console.warn(
                `Skipping dev application seed: missing refs for ${appSeed.candidateEmail} ${appSeed.courseCode} ${appSeed.roleName}`
            );
            continue;
        }

        let application = await applicationRepository.findOne({
            where: {
                candidateId: candidate.id,
                courseId: course.id,
                roleId: role.id,
            },
        });

        if (!application) {
            application = applicationRepository.create({
                candidateId: candidate.id,
                courseId: course.id,
                roleId: role.id,
            });
        }

        application.status = appSeed.status;
        application.availability = { type: appSeed.availability };
        application.skills = appSeed.skills;
        application.motivation = appSeed.motivation;
        application.experience = appSeed.experience;

        if (appSeed.comment && lecturer) {
            application.comment = appSeed.comment;
            application.commentedBy = lecturer.id;
            application.commentedAt = application.commentedAt ?? new Date();
        }

        if (appSeed.rank != null && lecturer) {
            application.rank = appSeed.rank;
            application.rankedBy = lecturer.id;
            application.rankedAt = application.rankedAt ?? new Date();
            application.rankedForCourse = appSeed.courseCode;
        }

        application = await applicationRepository.save(application);

        if (appSeed.status === ApplicationStatus.SELECTED && lecturer) {
            const existingSelection = await selectionRepository.findOne({
                where: { applicationId: application.id },
            });
            if (!existingSelection) {
                await selectionRepository.save(
                    selectionRepository.create({
                        applicationId: application.id,
                        selectedById: lecturer.id,
                    })
                );
            }
        }
    }

    const alice = userByEmail.get("alice.chen@candidate.edu.au");
    if (alice) {
        const existing = await notificationRepository.findOne({
            where: {
                userId: alice.id,
                title: "Welcome to TeachTeam (dev seed)",
            },
        });
        if (!existing) {
            await notificationRepository.save(
                notificationRepository.create({
                    userId: alice.id,
                    type: NotificationType.APPLICATION_SUBMITTED,
                    title: "Welcome to TeachTeam (dev seed)",
                    message:
                        "Your sample applications are ready. Use this account to explore the candidate dashboard.",
                    link: "/tutor",
                    read: false,
                })
            );
        }
    }

    const john = userByEmail.get("john.smith@lecturer.edu.au");
    if (john) {
        const existing = await notificationRepository.findOne({
            where: {
                userId: john.id,
                title: "Dev seed: review applications",
            },
        });
        if (!existing) {
            await notificationRepository.save(
                notificationRepository.create({
                    userId: john.id,
                    type: NotificationType.APPLICATION_SUBMITTED,
                    title: "Dev seed: review applications",
                    message:
                        "Multiple sample applicants are waiting on COSC2758. Open the lecturer dashboard to review, rank, and comment.",
                    link: "/lecturer",
                    read: false,
                })
            );
        }
    }

    console.log(
        `Dev dataset ready: ${DEV_CANDIDATES.length} candidates, ${DEV_APPLICATIONS.length} application scenarios (password: ${DEV_CANDIDATE_PASSWORD})`
    );
}
