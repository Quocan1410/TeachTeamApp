import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity("passkey_credentials")
@Index(["credentialId"], { unique: true })
@Index(["userId"], { unique: true })
export class PasskeyCredential {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 36 })
    userId: string;

    @Column({ type: "varchar", length: 512 })
    credentialId: string;

    @Column({ type: "text" })
    publicKey: string;

    @Column({ type: "int", default: 0 })
    counter: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    transports: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
