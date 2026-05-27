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
import { ApplicationDraft } from "../entities/ApplicationDraft";

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
    {
        email: "lisa.tran@candidate.edu.au",
        firstName: "Lisa",
        lastName: "Tran",
        isBlocked: false,
    },
    {
        email: "marco.rossi@candidate.edu.au",
        firstName: "Marco",
        lastName: "Rossi",
        isBlocked: false,
    },
    {
        email: "nina.okonkwo@candidate.edu.au",
        firstName: "Nina",
        lastName: "Okonkwo",
        isBlocked: false,
    },
    {
        email: "omar.hassan@candidate.edu.au",
        firstName: "Omar",
        lastName: "Hassan",
        isBlocked: false,
    },
    {
        email: "priya.sharma@candidate.edu.au",
        firstName: "Priya",
        lastName: "Sharma",
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
    lecturerNotes?: string;
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
    {
        candidateEmail: "daniel.lee@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "C++, algorithms, mentoring, LaTeX",
        motivation: "Shortlisted for strong algorithms background.",
        lecturerNotes: "Strong technical interview — schedule second panel.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "henry.wong@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "Linux, Docker, AWS, CI/CD",
        motivation: "Platform ops experience relevant to full stack cohort.",
        lecturerNotes: "Good DevOps narrative; compare with Eva before final select.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "iris.martinez@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "Algorithms, Python, tutoring",
        motivation: "Cross-training in full stack while supporting algorithms students.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "grace.kim@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Java, OOP, debugging",
        motivation: "Want to broaden from advanced Java into web stack labs.",
    },
    {
        candidateEmail: "bob.nguyen@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "Python, JavaScript, Git",
        motivation: "Re-applying for lab role after improving React portfolio.",
        lecturerNotes: "Improved since rejection — worth shortlist for lab stream.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "jack.turner@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "JavaScript, React, communication",
        motivation: "Applying to tutor after peer mentoring experience.",
    },
    {
        candidateEmail: "lisa.tran@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "TypeScript, React, UX basics, Figma",
        motivation: "UI-focused tutor support for design-heavy assignments.",
    },
    {
        candidateEmail: "lisa.tran@candidate.edu.au",
        courseCode: "COSC2671",
        roleName: "lab_assistant",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "HTML, CSS, accessibility, JavaScript",
        motivation: "Web fundamentals lab fits my frontend internship.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "marco.rossi@candidate.edu.au",
        courseCode: "COSC2938",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "Angular, RxJS, testing, Italian/English bilingual",
        motivation: "Can support international students in advanced web.",
    },
    {
        candidateEmail: "marco.rossi@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "tutor",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "Angular, TypeScript",
        motivation: "Prefer COSC2938 but applied to full stack as backup.",
        comment: "Angular-heavy profile — better fit for COSC2938 pipeline.",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "nina.okonkwo@candidate.edu.au",
        courseCode: "COSC2123",
        roleName: "tutor",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Full Time",
        skills: "Algorithms, discrete math, Python",
        motivation: "PASS leader experience for algorithms cohort.",
        lecturerNotes: "Excellent proofs walkthrough in mock session.",
        lecturerEmail: "sarah.johnson@lecturer.edu.au",
    },
    {
        candidateEmail: "nina.okonkwo@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Python, SQL, algorithms",
        motivation: "Secondary application for broader teaching hours.",
    },
    {
        candidateEmail: "omar.hassan@candidate.edu.au",
        courseCode: "COSC2767",
        roleName: "tutor",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Kubernetes, Terraform, monitoring",
        motivation: "Industry SRE experience for deployment course.",
        comment: "Top pick for ops tutorials — start onboarding early.",
        rank: 1,
        lecturerEmail: "michael.williams@lecturer.edu.au",
    },
    {
        candidateEmail: "omar.hassan@candidate.edu.au",
        courseCode: "COSC2758",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Docker, Linux, scripting",
        motivation: "Cross-skill into full stack lab support.",
    },
    {
        candidateEmail: "priya.sharma@candidate.edu.au",
        courseCode: "COSC1295",
        roleName: "tutor",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "Java, Spring, design patterns",
        motivation: "Enterprise Java tutor for advanced programming.",
        lecturerNotes: "Solid OOP interview — shortlist for Michael's course.",
        lecturerEmail: "michael.williams@lecturer.edu.au",
    },
    {
        candidateEmail: "priya.sharma@candidate.edu.au",
        courseCode: "COSC2938",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "React, Node.js, Jest",
        motivation: "Lab assistant role while completing honours project.",
    },
    {
        candidateEmail: "alice.chen@candidate.edu.au",
        courseCode: "COSC2938",
        roleName: "tutor",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "React, Node.js, teaching",
        motivation: "Progressing from pending apps toward tutor pipeline.",
        lecturerNotes: "Monitor tutorial demo — decide by week 6.",
        lecturerEmail: "emily.brown@lecturer.edu.au",
    },
    {
        candidateEmail: "lisa.tran@candidate.edu.au",
        courseCode: "COSC2401",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "SQL, PostgreSQL, ER modelling, normalization",
        motivation: "Database systems aligns with my data engineering internship.",
    },
    {
        candidateEmail: "grace.kim@candidate.edu.au",
        courseCode: "COSC2401",
        roleName: "lab_assistant",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "MySQL, SQL, Java",
        motivation: "Support SQL labs and query tuning workshops.",
        lecturerNotes: "Strong lab demo — confirm before deadline (7 days).",
        lecturerEmail: "john.smith@lecturer.edu.au",
    },
    {
        candidateEmail: "marco.rossi@candidate.edu.au",
        courseCode: "COSC2510",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "Networking, Wireshark, TCP/IP, security basics",
        motivation: "Teaching networks after CCNA study group experience.",
    },
    {
        candidateEmail: "henry.wong@candidate.edu.au",
        courseCode: "COSC2510",
        roleName: "lab_assistant",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "Linux, networking, bash, monitoring",
        motivation: "Lab assistant for packet capture and routing labs.",
        lecturerEmail: "sarah.johnson@lecturer.edu.au",
    },
    {
        candidateEmail: "nina.okonkwo@candidate.edu.au",
        courseCode: "COSC2207",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "Security, cryptography, Python, threat modelling",
        motivation: "Cyber security fundamentals matches honours research area.",
    },
    {
        candidateEmail: "jack.turner@candidate.edu.au",
        courseCode: "COSC2207",
        roleName: "lab_assistant",
        status: ApplicationStatus.REJECTED,
        availability: "Part Time",
        skills: "Basic security, scripting",
        motivation: "Building security lab experience.",
        comment: "Needs more hands-on lab portfolio for this intake.",
        lecturerEmail: "sarah.johnson@lecturer.edu.au",
    },
    {
        candidateEmail: "omar.hassan@candidate.edu.au",
        courseCode: "COSC2810",
        roleName: "tutor",
        status: ApplicationStatus.SHORTLISTED,
        availability: "Part Time",
        skills: "Agile, Jira, CI/CD, code review",
        motivation: "Industry agile coach experience for software engineering process.",
        lecturerNotes: "Excellent sprint planning workshop sample.",
        lecturerEmail: "emily.brown@lecturer.edu.au",
    },
    {
        candidateEmail: "priya.sharma@candidate.edu.au",
        courseCode: "COSC2625",
        roleName: "tutor",
        status: ApplicationStatus.PENDING,
        availability: "Part Time",
        skills: "React Native, TypeScript, mobile UX",
        motivation: "Published two student apps — keen to mentor mobile cohort.",
    },
    {
        candidateEmail: "iris.martinez@candidate.edu.au",
        courseCode: "COSC2625",
        roleName: "lab_assistant",
        status: ApplicationStatus.SELECTED,
        availability: "Part Time",
        skills: "Flutter, React Native, API integration",
        motivation: "Mobile lab support during semester 2 intake.",
        comment: "Top mobile lab candidate for Michael's stream.",
        rank: 1,
        lecturerEmail: "michael.williams@lecturer.edu.au",
    },
    {
        candidateEmail: "bob.nguyen@candidate.edu.au",
        courseCode: "COSC2810",
        roleName: "lab_assistant",
        status: ApplicationStatus.PENDING,
        availability: "Full Time",
        skills: "Git, GitHub Actions, testing, documentation",
        motivation: "DevOps-minded lab support for agile delivery units.",
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

        if (appSeed.lecturerNotes) {
            application.lecturerNotes = appSeed.lecturerNotes;
        }

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

    const draftRepository = AppDataSource.getRepository(ApplicationDraft);
    const draftSeeds = [
        {
            email: "lisa.tran@candidate.edu.au",
            courseCode: "COSC2938",
            roleName: "tutor" as const,
            payload: {
                availability: "Part Time",
                skills: "React, Next.js, testing",
                motivation: "Draft — finishing portfolio before submit.",
            },
        },
        {
            email: "priya.sharma@candidate.edu.au",
            courseCode: "COSC2758",
            roleName: "lab_assistant" as const,
            payload: {
                availability: "Full Time",
                skills: "Java, React, SQL",
                experience: "Teaching assistant (2024)",
            },
        },
    ];
    for (const d of draftSeeds) {
        const candidate = userByEmail.get(d.email);
        const c = courseByCode.get(d.courseCode);
        const r = roleByName.get(d.roleName);
        if (!candidate || !c || !r) continue;
        let draft = await draftRepository.findOne({
            where: {
                candidateId: candidate.id,
                courseId: c.id,
                roleId: r.id,
            },
        });
        if (!draft) {
            await draftRepository.save(
                draftRepository.create({
                    candidateId: candidate.id,
                    courseId: c.id,
                    roleId: r.id,
                    payload: d.payload,
                })
            );
        }
    }

    const notificationSeeds = [
        {
            email: "carla.santos@candidate.edu.au",
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "Application selected",
            message: "You have been selected for COSC2758 — check your dashboard.",
            link: "/tutor",
        },
        {
            email: "bob.nguyen@candidate.edu.au",
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "Application update",
            message: "Your COSC2758 application status changed — review feedback.",
            link: "/tutor",
        },
        {
            email: "daniel.lee@candidate.edu.au",
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "Shortlisted",
            message: "You are shortlisted for COSC2758 tutor — prepare for follow-up.",
            link: "/tutor",
        },
        {
            email: "sarah.johnson@lecturer.edu.au",
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "New applicants on COSC2123",
            message: "3 pending and 1 shortlisted — kanban ready for review.",
            link: "/lecturer",
        },
        {
            email: "emily.brown@lecturer.edu.au",
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "COSC2938 shortlist",
            message: "Review shortlisted tutors for Further Web Programming.",
            link: "/lecturer",
        },
    ];
    for (const n of notificationSeeds) {
        const u = userByEmail.get(n.email);
        if (!u) continue;
        const exists = await notificationRepository.findOne({
            where: { userId: u.id, title: n.title },
        });
        if (!exists) {
            await notificationRepository.save(
                notificationRepository.create({
                    userId: u.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    link: n.link,
                    read: false,
                })
            );
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
