import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm";

export type PasskeyChallengePurpose = "register" | "login";

@Entity("passkey_challenges")
@Index(["challenge"], { unique: true })
export class PasskeyChallenge {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36, nullable: true })
    userId: string | null;

    @Column({ type: "varchar", length: 512 })
    challenge: string;

    @Column({ type: "varchar", length: 16 })
    purpose: PasskeyChallengePurpose;

    @Column({ type: "datetime" })
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
