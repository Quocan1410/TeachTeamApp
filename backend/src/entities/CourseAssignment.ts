import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { User } from "./User";
import { Course } from "./Course";

@Entity("course_assignments")
@Index(["lecturerId", "courseId"], { unique: true })
export class CourseAssignment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    lecturerId: string;

    @Column({ type: "varchar", length: 36 })
    courseId: string;

    @CreateDateColumn()
    assignedAt: Date;

    // Relationships
    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "lecturerId" })
    lecturer: User;

    @ManyToOne(() => Course, (course) => course.courseAssignments, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "courseId" })
    course: Course;

    // Virtual properties
    get assignmentKey(): string {
        return `${this.lecturerId}-${this.courseId}`;
    }
}
