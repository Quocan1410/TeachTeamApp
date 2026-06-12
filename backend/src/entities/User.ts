import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    // OneToMany,
} from "typeorm";
// import { CourseAssignment } from "./CourseAssignment";
// import { Application } from "./Application";
// import { SelectedCandidate } from "./SelectedCandidate";

export enum UserType {
    CANDIDATE = "candidate",
    LECTURER = "lecturer",
    ADMIN = "admin",
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "varchar",
        length: 255,
        unique: true,
        nullable: false,
    })
    email: string;

    @Column({
        type: "varchar",
        length: 255,
        nullable: false,
    })
    password: string;

    @Column({
        type: "varchar",
        length: 100,
        nullable: false,
    })
    firstName: string;

    @Column({
        type: "varchar",
        length: 100,
        nullable: false,
    })
    lastName: string;

    @Column({
        type: "varchar",
        length: 20,
        nullable: false,
    })
    userType: UserType;

    @Column({
        type: "varchar",
        length: 10,
        nullable: true,
    })
    honorific: string | null;

    @Column({
        type: "boolean",
        default: false,
    })
    isBlocked: boolean;

    @Column({
        type: "varchar",
        length: 512,
        nullable: true,
    })
    avatarUrl: string | null;

    @Column({
        type: "varchar",
        length: 10,
        default: "dark",
    })
    theme: "light" | "dark";

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({
        type: "datetime",
        precision: 6,
        nullable: true,
    })
    deletedAt: Date | null;

    // Relationships - Commented out for PA part b (authentication only)
    // @OneToMany(
    //     () => CourseAssignment,
    //     (courseAssignment) => courseAssignment.lecturer
    // )
    // courseAssignments: CourseAssignment[];

    // @OneToMany(() => Application, (application) => application.candidate)
    // applications: Application[];

    // @OneToMany(
    //     () => SelectedCandidate,
    //     (selectedCandidate) => selectedCandidate.selectedBy
    // )
    // candidateSelections: SelectedCandidate[];

    // Virtual properties
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    get isCandidate(): boolean {
        return this.userType === UserType.CANDIDATE;
    }

    get isLecturer(): boolean {
        return this.userType === UserType.LECTURER;
    }

    get isAdmin(): boolean {
        return this.userType === UserType.ADMIN;
    }
}
