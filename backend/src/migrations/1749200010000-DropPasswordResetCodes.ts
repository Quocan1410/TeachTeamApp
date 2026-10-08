import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPasswordResetCodes1749200010000 implements MigrationInterface {
    name = "DropPasswordResetCodes1749200010000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `password_reset_codes`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `password_reset_codes` (`id` varchar(36) NOT NULL, `userId` varchar(36) NOT NULL, `codeHash` varchar(64) NOT NULL, `expiresAt` datetime NOT NULL, `attempts` int NOT NULL DEFAULT 0, `usedAt` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_password_reset_codes_userId` (`userId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "ALTER TABLE `password_reset_codes` ADD CONSTRAINT `FK_password_reset_codes_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
        );
    }
}
