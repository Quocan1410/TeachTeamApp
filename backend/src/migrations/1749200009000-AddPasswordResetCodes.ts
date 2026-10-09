import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetCodes1749200009000 implements MigrationInterface {
    name = "AddPasswordResetCodes1749200009000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `password_reset_codes` (`id` varchar(36) NOT NULL, `userId` varchar(36) NOT NULL, `codeHash` varchar(64) NOT NULL, `expiresAt` datetime NOT NULL, `attempts` int NOT NULL DEFAULT 0, `usedAt` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_password_reset_codes_userId` (`userId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "ALTER TABLE `password_reset_codes` ADD CONSTRAINT `FK_password_reset_codes_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `password_reset_codes` DROP FOREIGN KEY `FK_password_reset_codes_user`"
        );
        await queryRunner.query("DROP TABLE `password_reset_codes`");
    }
}
