import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { CourseAssignment } from "./CourseAssignment";
import { Application } from "./Application";
import { CourseSession } from "./CourseSession";
import { CourseChangeRequest } from "./CourseChangeRequest";

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "varchar",
        length: 20,
        unique: true,
        nullable: false,
    })
    courseCode: string;

    @Column({
        type: "varchar",
        length: 255,
        nullable: false,
    })
    courseName: string;

    @Column({
        type: "varchar",
        length: 50,
        nullable: false,
    })
    semester: string;

    @Column({
        type: "text",
        nullable: true,
    })
    description?: string;

    @Column({
        type: "int",
        default: 5,
    })
    maxTutors: number;

    @Column({
        type: "int",
        default: 3,
    })
    maxLabAssistants: number;

    /** Target students per tutorial class (about 10–20). */
    @Column({
        type: "int",
        default: 15,
    })
    studentsPerClass: number;

    /** When true, public openings use live fields; further edits need approval. */
    @Column({
        type: "boolean",
        default: false,
    })
    isPublished: boolean;

    @Column({
        type: "datetime",
        nullable: true,
    })
    applicationDeadline: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @OneToMany(
        () => CourseAssignment,
        (courseAssignment) => courseAssignment.course
    )
    courseAssignments: CourseAssignment[];

    @OneToMany(() => Application, (application) => application.course)
    applications: Application[];

    @OneToMany(() => CourseSession, (session) => session.course)
    sessions: CourseSession[];

    @OneToMany(() => CourseChangeRequest, (request) => request.course)
    changeRequests: CourseChangeRequest[];

    // Virtual properties
    get displayName(): string {
        return `${this.courseCode} - ${this.courseName}`;
    }

    get shortDisplayName(): string {
        return `${this.courseCode} (${this.semester})`;
    }
}
