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
import { User } from "./User";
import { Course } from "./Course";
import { Role } from "./Role";

export interface ApplicationDraftPayload {
    availability?: string;
    skills?: string;
    experience?: string;
    motivation?: string;
}

@Entity("application_drafts")
@Index(["candidateId", "courseId", "roleId"], { unique: true })
export class ApplicationDraft {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    candidateId: string;

    @Column({ type: "varchar", length: 36 })
    courseId: string;

    @Column({ type: "varchar", length: 36 })
    roleId: string;

    @Column({ type: "json" })
    payload: ApplicationDraftPayload;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "candidateId" })
    candidate: User;

    @ManyToOne(() => Course, { onDelete: "CASCADE" })
    @JoinColumn({ name: "courseId" })
    course: Course;

    @ManyToOne(() => Role, { onDelete: "CASCADE" })
    @JoinColumn({ name: "roleId" })
    role: Role;
}
