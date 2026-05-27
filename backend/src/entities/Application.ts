import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from "typeorm";
import { User } from "./User";
import { Course } from "./Course";
import { Role } from "./Role";
import { SelectedCandidate } from "./SelectedCandidate";

export enum ApplicationStatus {
    PENDING = "pending",
    SHORTLISTED = "shortlisted",
    SELECTED = "selected",
    REJECTED = "rejected",
}

@Entity("applications")
@Index(["candidateId", "courseId", "roleId"], { unique: true })
export class Application {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "int",
        nullable: false,
    })
    candidateId: number;

    @Column({
        type: "int",
        nullable: false,
    })
    courseId: number;

    @Column({
        type: "int",
        nullable: false,
    })
    roleId: number;

    @Column({
        type: "varchar",
        length: 20,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

    @Column({
        type: "json",
        nullable: true,
    })
    availability?: object;

    @Column({
        type: "text",
        nullable: true,
    })
    skills?: string;

    @Column({
        type: "text",
        nullable: true,
    })
    experience?: string;

    @Column({
        type: "text",
        nullable: true,
    })
    motivation?: string;

    @Column({
        type: "text",
        nullable: true,
    })
    lecturerNotes?: string | null;

    // Lecturer comment fields (visible to candidate via notification)
    @Column({
        type: "text",
        nullable: true,
    })
    comment?: string;

    @Column({
        type: "int",
        nullable: true,
    })
    commentedBy?: number;

    @Column({
        type: "datetime",
        nullable: true,
    })
    commentedAt?: Date;

    // Ranking fields
    @Column({
        type: "int",
        nullable: true,
    })
    rank?: number | null;

    @Column({
        type: "int",
        nullable: true,
    })
    rankedBy?: number | null;

    @Column({
        type: "datetime",
        nullable: true,
    })
    rankedAt?: Date | null;

    @Column({
        type: "varchar",
        length: 20,
        nullable: true,
    })
    rankedForCourse?: string | null;

    @CreateDateColumn()
    appliedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "candidateId" })
    candidate: User;

    @ManyToOne(() => Course, (course) => course.applications, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "courseId" })
    course: Course;

    @ManyToOne(() => Role, (role) => role.applications, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "roleId" })
    role: Role;

    @OneToMany(
        () => SelectedCandidate,
        (selectedCandidate) => selectedCandidate.application
    )
    selections: SelectedCandidate[];

    // Comment and ranking relationships
    @ManyToOne(() => User, {
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "commentedBy" })
    commentedByUser?: User;

    @ManyToOne(() => User, {
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "rankedBy" })
    rankedByUser?: User;

    // Virtual properties
    get isSelected(): boolean {
        return this.status === ApplicationStatus.SELECTED;
    }

    get isPending(): boolean {
        return this.status === ApplicationStatus.PENDING;
    }

    get isShortlisted(): boolean {
        return this.status === ApplicationStatus.SHORTLISTED;
    }

    get isRejected(): boolean {
        return this.status === ApplicationStatus.REJECTED;
    }

    get applicationKey(): string {
        return `${this.candidateId}-${this.courseId}-${this.roleId}`;
    }

    get hasComment(): boolean {
        return !!(this.comment && this.comment.trim().length > 0);
    }

    get isRanked(): boolean {
        return this.rank !== null && this.rank !== undefined;
    }

    get canBeRanked(): boolean {
        return this.isSelected && this.hasComment;
    }

    get commentSummary(): string {
        if (!this.comment) return "";
        return this.comment.length > 50 ? this.comment.substring(0, 50) + "..." : this.comment;
    }
}
