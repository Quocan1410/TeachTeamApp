import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { Course } from "./Course";

export type CourseSessionType = "lecture" | "tutorial";

@Entity("course_sessions")
@Index(["courseId", "dayOfWeek", "startTime"])
export class CourseSession {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    courseId: string;

    @Column({ type: "varchar", length: 20 })
    sessionType: CourseSessionType;

    /** 0 = Sunday … 6 = Saturday */
    @Column({ type: "tinyint" })
    dayOfWeek: number;

    @Column({ type: "varchar", length: 8 })
    startTime: string;

    @Column({ type: "varchar", length: 8 })
    endTime: string;

    @Column({ type: "varchar", length: 120, nullable: true })
    location: string | null;

    /** Students per class for tutorials; lecture may be null. */
    @Column({ type: "int", nullable: true })
    capacity: number | null;

    @Column({ type: "int", default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Course, (course) => course.sessions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "courseId" })
    course: Course;
}
