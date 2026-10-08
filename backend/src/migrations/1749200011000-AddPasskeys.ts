import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasskeys1749200011000 implements MigrationInterface {
    name = "AddPasskeys1749200011000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`passkey_credentials\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`credentialId\` varchar(512) NOT NULL,
                \`publicKey\` text NOT NULL,
                \`counter\` int NOT NULL DEFAULT 0,
                \`transports\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_passkey_credential_id\` (\`credentialId\`),
                UNIQUE INDEX \`IDX_passkey_user\` (\`userId\`),
                CONSTRAINT \`FK_passkey_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`passkey_challenges\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NULL,
                \`challenge\` varchar(512) NOT NULL,
                \`purpose\` varchar(16) NOT NULL,
                \`expiresAt\` datetime NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_passkey_challenge\` (\`challenge\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `passkey_challenges`");
        await queryRunner.query("DROP TABLE IF EXISTS `passkey_credentials`");
    }
}
