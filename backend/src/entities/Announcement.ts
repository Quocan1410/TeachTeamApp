import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

export enum AnnouncementAudience {
    ALL = "all",
    CANDIDATE = "candidate",
    LECTURER = "lecturer",
}

@Entity("announcements")
export class Announcement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 200 })
    title: string;

    @Column({ type: "text" })
    body: string;

    @Column({
        type: "varchar",
        length: 20,
        default: AnnouncementAudience.ALL,
    })
    audience: AnnouncementAudience;

    @Column({ type: "datetime", nullable: true })
    startsAt: Date | null;

    @Column({ type: "datetime", nullable: true })
    endsAt: Date | null;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @Column({ type: "int", nullable: true })
    createdBy: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
