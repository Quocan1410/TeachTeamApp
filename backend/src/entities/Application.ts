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
    SELECTED = "selected",
    REJECTED = "rejected",
}

export enum OfferResponse {
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
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

    /** Threaded chat messages between candidate and lecturer. */
    @Column({
        type: "json",
        nullable: true,
    })
    correspondenceMessages?: Array<{
        id: string;
        authorRole: "candidate" | "lecturer";
        authorId: number;
        body: string;
        createdAt: string;
        editedAt?: string | null;
        deletedAt?: string | null;
        replyToMessageId?: string | null;
    }> | null;

    @Column({
        type: "text",
        nullable: true,
    })
    candidateResponse?: string | null;

    @Column({
        type: "datetime",
        nullable: true,
    })
    candidateRespondedAt?: Date | null;

    @Column({
        type: "boolean",
        default: false,
    })
    isWithdrawn: boolean;

    @Column({
        type: "datetime",
        nullable: true,
    })
    withdrawnAt?: Date | null;

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

    /** Emoji reactions per correspondence message id (lecturer | candidate). */
    @Column({
        type: "json",
        nullable: true,
    })
    messageReactions?: Record<string, Record<string, number[]>> | null;

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

    /** Candidate response to a final selection offer. */
    @Column({
        type: "varchar",
        length: 20,
        nullable: true,
    })
    offerResponse?: OfferResponse | null;

    @Column({
        type: "datetime",
        nullable: true,
    })
    offerRespondedAt?: Date | null;

    /** Lecturer opened/reviewed the application (with or without chat message). */
    @Column({
        type: "datetime",
        nullable: true,
    })
    reviewedAt?: Date | null;

    @Column({
        type: "int",
        nullable: true,
    })
    reviewedBy?: number | null;

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
        return this.status === ApplicationStatus.PENDING && !this.isRejected;
    }

    get commentSummary(): string {
        if (!this.comment) return "";
        return this.comment.length > 50 ? this.comment.substring(0, 50) + "..." : this.comment;
    }
}
