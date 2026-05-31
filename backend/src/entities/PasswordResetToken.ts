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

@Entity("password_reset_tokens")
@Index(["tokenHash"], { unique: true })
export class PasswordResetToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    userId: number;

    @Column({ type: "varchar", length: 64 })
    tokenHash: string;

    @Column({ type: "datetime" })
    expiresAt: Date;

    @Column({ type: "datetime", nullable: true })
    usedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;
}
