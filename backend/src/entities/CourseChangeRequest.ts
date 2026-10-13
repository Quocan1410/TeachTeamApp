import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { Course } from "./Course";
import { User } from "./User";

export type CourseChangeRequestType = "content" | "capacity" | "schedule";
export type CourseChangeRequestStatus =
    | "pending"
    | "approved"
    | "rejected";

@Entity("course_change_requests")
@Index(["courseId", "status"])
export class CourseChangeRequest {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    courseId: string;

    @Column({ type: "varchar", length: 36 })
    requestedById: string;

    @Column({ type: "varchar", length: 20 })
    requestType: CourseChangeRequestType;

    @Column({ type: "json" })
    payload: Record<string, unknown>;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status: CourseChangeRequestStatus;

    @Column({ type: "text", nullable: true })
    adminNote: string | null;

    @Column({ type: "varchar", length: 36, nullable: true })
    resolvedById: string | null;

    @Column({ type: "datetime", nullable: true })
    resolvedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Course, (course) => course.changeRequests, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "courseId" })
    course: Course;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "requestedById" })
    requestedBy: User;
}
