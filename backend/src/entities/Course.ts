import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from "typeorm";
import { CourseAssignment } from "./CourseAssignment";
import { Application } from "./Application";

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

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

    // Virtual properties
    get displayName(): string {
        return `${this.courseCode} - ${this.courseName}`;
    }

    get shortDisplayName(): string {
        return `${this.courseCode} (${this.semester})`;
    }
}
