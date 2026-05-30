import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum NotificationType {
    APPLICATION_SUBMITTED = "application_submitted",
    APPLICATION_SELECTED = "application_selected",
    APPLICATION_REJECTED = "application_rejected",
    APPLICATION_COMMENT = "application_comment",
    APPLICATION_RESPONSE = "application_response",
    APPLICATION_WITHDRAWN = "application_withdrawn",
    CANDIDATE_BLOCKED = "candidate_blocked",
    CANDIDATE_UNBLOCKED = "candidate_unblocked",
    ACCOUNT_BLOCKED = "account_blocked",
    ACCOUNT_UNBLOCKED = "account_unblocked",
    USER_REGISTERED = "user_registered",
    COURSE_ASSIGNED = "course_assigned",
}

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    userId: number;

    @Column({ type: "varchar", length: 50 })
    type: NotificationType;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "text" })
    message: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    link?: string | null;

    @Column({ type: "json", nullable: true })
    metadata?: Record<string, unknown> | null;

    @Column({ type: "boolean", default: false })
    read: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;
}
