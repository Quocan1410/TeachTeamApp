import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Application } from "./Application";

@Entity("roles")
export class Role {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "varchar",
        length: 50,
        unique: true,
        nullable: false,
    })
    roleName: string;

    @Column({
        type: "text",
        nullable: true,
    })
    description?: string;

    // Relationships
    @OneToMany(() => Application, (application) => application.role)
    applications: Application[];

    // Static role constants for easy reference
    static readonly TUTOR = "tutor";
    static readonly LAB_ASSISTANT = "lab_assistant";

    // Virtual properties
    get isTutor(): boolean {
        return this.roleName === Role.TUTOR;
    }

    get isLabAssistant(): boolean {
        return this.roleName === Role.LAB_ASSISTANT;
    }
}
