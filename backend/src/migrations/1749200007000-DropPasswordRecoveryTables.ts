import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPasswordRecoveryTables1749200007000
    implements MigrationInterface
{
    name = "DropPasswordRecoveryTables1749200007000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `password_reset_tokens`");
        await queryRunner.query("DROP TABLE IF EXISTS `user_security_answers`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TABLE `user_security_answers` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `questionId` varchar(32) NOT NULL, `answerHash` varchar(255) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_user_security_answers_user_question` (`userId`, `questionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
        await queryRunner.query(
            "CREATE TABLE `password_reset_tokens` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `tokenHash` varchar(64) NOT NULL, `expiresAt` datetime NOT NULL, `usedAt` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_password_reset_tokens_tokenHash` (`tokenHash`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
        );
    }
}
