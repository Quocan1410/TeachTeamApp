import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { Application } from "./Application";
import { User } from "./User";

@Entity("selected_candidates")
@Index(["applicationId"], { unique: true })
export class SelectedCandidate {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    applicationId: string;

    @Column({ type: "varchar", length: 36 })
    selectedById: string;

    @CreateDateColumn()
    selectedAt: Date;

    // Relationships
    @ManyToOne(() => Application, (application) => application.selections, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "applicationId" })
    application: Application;

    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "selectedById" })
    selectedBy: User;

    // Virtual properties
    get selectionKey(): string {
        return `${this.applicationId}-${this.selectedById}`;
    }
}
